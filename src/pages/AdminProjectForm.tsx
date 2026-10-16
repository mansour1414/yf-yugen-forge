import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { MediaLibraryItem, MediaLibraryModal } from '../components/MediaLibraryModal';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface AdminProjectFormProps {
  projectId?: string;
}

export const AdminProjectForm: React.FC<AdminProjectFormProps> = ({ projectId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = !!projectId;
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    slug: '',
    shortDescriptionAr: '',
    shortDescriptionEn: '',
    descriptionAr: '',
    descriptionEn: '',
    status: 'DRAFT',
    categoryAr: '',
    categoryEn: '',
    typeAr: '',
    typeEn: '',
    coverImage: '',
    thumbnail: '',
    liveUrl: '',
    repositoryUrl: '',
    githubUrl: '',
    figmaUrl: '',
    seoTitle: '',
    seoDescription: '',
    featured: false,
    displayOrder: 0,
    startDate: '',
    endDate: '',
    clientId: '',
  });

  const [mediaList, setMediaList] = useState<Array<{ name: string; type: string; url: string; alt: string; displayOrder: number }>>([]);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'cover' | 'thumbnail' | 'gallery' | null>(null);

  const selectMedia = (media: MediaLibraryItem) => {
    if (mediaPickerTarget === 'cover') {
      setForm((current) => ({ ...current, coverImage: media.url }));
    } else if (mediaPickerTarget === 'thumbnail') {
      setForm((current) => ({ ...current, thumbnail: media.url }));
    } else if (mediaPickerTarget === 'gallery') {
      setMediaList((current) => [
        ...current,
        {
          name: media.name,
          type: media.mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE',
          url: media.url,
          alt: media.name,
          displayOrder: current.length,
        },
      ]);
    }
    setMediaPickerTarget(null);
  };

  useEffect(() => {
    if (isEditing) {
      api.get(`/api/projects/${projectId}`)
        .then((res) => {
          if (res.data && res.data.success) {
            const p = res.data.data;
            setForm({
              titleAr: p.titleAr || p.title || '',
              titleEn: p.titleEn || '',
              slug: p.slug || '',
              shortDescriptionAr: p.shortDescriptionAr || p.shortDescription || '',
              shortDescriptionEn: p.shortDescriptionEn || '',
              descriptionAr: p.descriptionAr || p.description || '',
              descriptionEn: p.descriptionEn || '',
              status: p.status || 'DRAFT',
              categoryAr: p.categoryAr || p.category || '',
              categoryEn: p.categoryEn || '',
              typeAr: p.typeAr || p.type || '',
              typeEn: p.typeEn || '',
              coverImage: p.coverImage || '',
              thumbnail: p.thumbnail || '',
              liveUrl: p.liveUrl || '',
              repositoryUrl: p.repositoryUrl || '',
              githubUrl: p.githubUrl || '',
              figmaUrl: p.figmaUrl || '',
              seoTitle: p.seoTitle || '',
              seoDescription: p.seoDescription || '',
              featured: p.featured || false,
              displayOrder: p.displayOrder || 0,
              startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
              endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
              clientId: p.clientId || '',
            });
            if (p.media) {
              setMediaList(p.media.map((m: any) => ({ name: m.name || '', type: m.type || 'IMAGE', url: m.url || '', alt: m.alt || '', displayOrder: m.displayOrder || 0 })));
            }
          }
        })
        .catch(() => setError(t('projectForm.loadError')))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  const handleTitleEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      titleEn: val,
      ...(!isEditing && {
        slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      }),
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addMediaItem = () => {
    setMediaList([...mediaList, { name: '', type: 'IMAGE', url: '', alt: '', displayOrder: mediaList.length }]);
  };

  const updateMediaItem = (index: number, field: string, val: any) => {
    const updated = [...mediaList];
    updated[index] = { ...updated[index], [field]: val };
    setMediaList(updated);
  };

  const removeMediaItem = (index: number) => {
    setMediaList(mediaList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        title: form.titleAr || form.titleEn || 'Project',
        shortDescription: form.shortDescriptionAr || form.shortDescriptionEn || 'Summary',
        description: form.descriptionAr || form.descriptionEn || 'Description',
        category: form.categoryAr || form.categoryEn || 'Web',
        type: form.typeAr || form.typeEn || 'WEB',
        displayOrder: Number(form.displayOrder),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        clientId: form.clientId || null,
        liveUrl: form.liveUrl || null,
        repositoryUrl: form.repositoryUrl || null,
        githubUrl: form.githubUrl || null,
        figmaUrl: form.figmaUrl || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        media: mediaList.map((m) => ({ ...m, displayOrder: Number(m.displayOrder) })),
      };

      if (isEditing) {
        await api.put(`/api/projects/${projectId}`, payload);
      } else {
        await api.post('/api/projects', payload);
      }

      navigate('/admin/projects');
    } catch (err: any) {
      setError(err.response?.data?.error || t('projectForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--muted)' }}>{t('projectForm.loadingForm')}</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader title={isEditing ? t('projectForm.editTitle') : t('projectForm.createTitle')} />

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '24px', borderRadius: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.titleAr')}</label>
              <input type="text" name="titleAr" value={form.titleAr} onChange={handleChange} required placeholder={t('projectForm.titleArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.titleEn')}</label>
              <input type="text" name="titleEn" value={form.titleEn} onChange={handleTitleEnChange} required placeholder={t('projectForm.titleEnPlaceholder')} />
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('projectForm.slug')}</label>
            <input type="text" name="slug" value={form.slug} onChange={handleChange} required placeholder={t('projectForm.slugPlaceholder')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.shortDescAr')}</label>
              <input type="text" name="shortDescriptionAr" value={form.shortDescriptionAr} onChange={handleChange} required placeholder={t('projectForm.shortDescArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.shortDescEn')}</label>
              <input type="text" name="shortDescriptionEn" value={form.shortDescriptionEn} onChange={handleChange} required placeholder={t('projectForm.shortDescEnPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.fullDescAr')}</label>
              <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} required rows={4} placeholder={t('projectForm.fullDescArPlaceholder')}></textarea>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.fullDescEn')}</label>
              <textarea name="descriptionEn" value={form.descriptionEn} onChange={handleChange} required rows={4} placeholder={t('projectForm.fullDescEnPlaceholder')}></textarea>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.categoryAr')}</label>
              <input type="text" name="categoryAr" value={form.categoryAr} onChange={handleChange} required placeholder={t('projectForm.categoryArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.categoryEn')}</label>
              <input type="text" name="categoryEn" value={form.categoryEn} onChange={handleChange} required placeholder={t('projectForm.categoryEnPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.typeAr')}</label>
              <input type="text" name="typeAr" value={form.typeAr} onChange={handleChange} required placeholder={t('projectForm.typeArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.typeEn')}</label>
              <input type="text" name="typeEn" value={form.typeEn} onChange={handleChange} required placeholder={t('projectForm.typeEnPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.status')}</label>
              <select name="status" value={form.status} onChange={handleChange} style={{ width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '14px 16px', color: 'var(--text)' }}>
                <option value="DRAFT">{t('projectsPage.status.draft')}</option>
                <option value="ACTIVE">{t('projectsPage.status.active')}</option>
                <option value="COMPLETED">{t('projectsPage.status.completed')}</option>
                <option value="ARCHIVED">{t('projectsPage.status.archived')}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.coverImage')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="url" name="coverImage" value={form.coverImage} onChange={handleChange} required placeholder="https://..." style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline" onClick={() => setMediaPickerTarget('cover')}>{t('projectForm.library')}</button>
              </div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('projectForm.thumbnail')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="url" name="thumbnail" value={form.thumbnail} onChange={handleChange} required placeholder="https://..." style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline" onClick={() => setMediaPickerTarget('thumbnail')}>{t('projectForm.library')}</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              {t('projectForm.featuredProject')}
            </label>
            <div className="field" style={{ margin: 0, flex: 1 }}>
              <label>{t('projectForm.displayOrder')}</label>
              <input type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange} style={{ width: '120px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <label style={{ margin: 0 }}>{t('projectForm.gallery')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setMediaPickerTarget('gallery')}>{t('projectForm.addFromLibrary')}</button>
                <button type="button" className="btn btn-outline" onClick={addMediaItem}>{t('projectForm.addCustomUrl')}</button>
              </div>
            </div>

            {mediaList.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{t('projectForm.noGalleryMedia')}</p>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {mediaList.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 100px auto', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px' }}>
                    {item.url ? (
                      item.type === 'VIDEO' ? (
                        <video src={item.url} style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} muted />
                      ) : (
                        <img src={item.url} alt={item.alt} style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      )
                    ) : (
                      <div style={{ width: '70px', height: '50px', borderRadius: '6px', background: 'rgba(255,255,255,.05)' }} />
                    )}
                    <input type="url" placeholder={t('projectForm.mediaUrlPlaceholder')} value={item.url} onChange={(e) => updateMediaItem(index, 'url', e.target.value)} style={{ margin: 0 }} />
                    <input type="text" placeholder={t('projectForm.altTextPlaceholder')} value={item.alt} onChange={(e) => updateMediaItem(index, 'alt', e.target.value)} style={{ margin: 0 }} />
                    <select value={item.type} onChange={(e) => updateMediaItem(index, 'type', e.target.value)} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px', color: 'var(--text)' }}>
                      <option value="IMAGE">{t('projectForm.image')}</option>
                      <option value="VIDEO">{t('projectForm.video')}</option>
                    </select>
                    <button type="button" className="btn btn-outline btn-danger" onClick={() => removeMediaItem(index)}>{t('projectForm.remove')}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <a href="/admin/projects" className="btn btn-outline">{t('common.cancel')}</a>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('projectForm.saving') : isEditing ? t('projectForm.updateBtn') : t('projectForm.createBtn')}
            </button>
          </div>
      </form>

      {mediaPickerTarget && (
        <MediaLibraryModal onClose={() => setMediaPickerTarget(null)} onSelect={selectMedia} allowedTypes={['image', 'video']} />
      )}
    </div>
  );
};

export default AdminProjectForm;
