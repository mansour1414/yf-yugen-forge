import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Copy, Trash2, Search, Image as ImageIcon, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { EmptyState } from '../components/admin/EmptyState';
import { Alert } from '../components/admin/Alert';

interface Folder {
  id: string;
  name: string;
}

interface MediaItem {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
  folder?: Folder | null;
  createdAt: string;
}

export const AdminMedia: React.FC = () => {
  const { t } = useTranslation('admin');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState('');
  const [folderId, setFolderId] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 18, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (folderId) params.folderId = folderId;
      if (mimeType) params.mimeType = mimeType;
      const res = await api.get('/api/media', { params });
      setItems(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setSelectedIds([]);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('mediaPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/api/media/folders').then((res) => setFolders(res.data?.data || [])).catch(() => setFolders([]));
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [page, search, folderId, mimeType]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    if (files.length === 1) {
      formData.append('file', files[0]);
      if (folderId) formData.append('folderId', folderId);
      await api.post('/api/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      Array.from(files).forEach((file) => formData.append('files', file));
      if (folderId) formData.append('folderId', folderId);
      await api.post('/api/media/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchMedia();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await uploadFiles(event.target.files);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('mediaPage.uploadError'));
      setUploading(false);
    }
  };

  const deleteFiles = async (ids: string[]) => {
    if (!ids.length || !window.confirm(t('mediaPage.deleteConfirm', { count: ids.length }))) return;
    try {
      await Promise.all(ids.map((id) => api.delete(`/api/media/${id}/file`)));
      fetchMedia();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('mediaPage.deleteError'));
    }
  };

  const copyUrl = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  const toggleItem = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <div>
      <PageHeader
        title={t('mediaPage.title')}
        subtitle={t('mediaPage.subtitle')}
        actions={
          <PermissionGuard permission="media.upload">
            <button className="btn btn-primary" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Upload size={15} /> {uploading ? t('mediaPage.uploading') : t('mediaPage.uploadFiles')}
            </button>
          </PermissionGuard>
        }
      />
      <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,application/pdf" onChange={handleUpload} style={{ display: 'none' }} />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="glass dash-card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', borderRadius: '14px' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input className="admin-toolbar-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('mediaPage.searchPlaceholder')} aria-label={t('mediaPage.searchPlaceholder')} style={{ width: '100%', border: 'none', background: 'none', padding: 0 }} />
        </div>
        <select className="admin-toolbar-select" value={folderId} onChange={(event) => { setFolderId(event.target.value); setPage(1); }}>
          <option value="">{t('mediaPage.allFolders')}</option>
          {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
        </select>
        <select className="admin-toolbar-select" value={mimeType} onChange={(event) => { setMimeType(event.target.value); setPage(1); }}>
          <option value="">{t('mediaPage.allFileTypes')}</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
          <option value="video/mp4">MP4</option>
          <option value="video/webm">WebM</option>
          <option value="video/quicktime">MOV</option>
          <option value="application/pdf">PDF</option>
        </select>
        {selectedIds.length > 0 && (
          <PermissionGuard permission="media.delete">
            <button className="btn btn-danger" onClick={() => deleteFiles(selectedIds)} style={{ gap: '6px' }}>
              <Trash2 size={13} /> {t('mediaPage.deleteSelected', { count: selectedIds.length })}
            </button>
          </PermissionGuard>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div className="dash-skeleton" style={{ height: '150px' }} />
              <div style={{ padding: '13px' }}>
                <div className="dash-skeleton" style={{ height: '12px', width: '70%', borderRadius: '6px', marginBottom: '8px' }} />
                <div className="dash-skeleton" style={{ height: '10px', width: '45%', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass dash-card" style={{ borderRadius: '16px', padding: '20px' }}>
          <table style={{ width: '100%' }}><tbody><EmptyState colSpan={1} icon={<ImageIcon size={30} />} message={t('mediaPage.noMedia')} /></tbody></table>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
            {items.map((item) => (
              <article key={item.id} className="glass dash-card" style={{ borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                <label style={{ position: 'absolute', top: '10px', insetInlineEnd: '10px', zIndex: 1 }}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleItem(item.id)} /></label>
                <div style={{ height: '150px', background: '#09040f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : item.mimeType.startsWith('video/') ? (
                    <video src={item.url} controls preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FileText size={34} color="var(--muted)" />
                  )}
                </div>
                <div style={{ padding: '13px' }}>
                  <div title={item.name} style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '5px' }}>{item.mimeType} · {(item.size / 1024 / 1024).toFixed(2)} MB</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-outline" onClick={() => copyUrl(item.id, item.url)} style={{ padding: '6px 9px', fontSize: '11px', gap: '5px', display: 'inline-flex', alignItems: 'center' }}>
                      <Copy size={11} /> {copiedId === item.id ? t('mediaPage.copied') : t('mediaPage.copyUrl')}
                    </button>
                    <PermissionGuard permission="media.delete">
                      <button className="btn btn-danger btn-xs" onClick={() => deleteFiles([item.id])} style={{ gap: '5px' }}>
                        <Trash2 size={11} /> {t('common.delete')}
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{t('common.pageOf', { page, total: totalPages })}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>{t('previous')}</button>
              <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>{t('next')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMedia;
