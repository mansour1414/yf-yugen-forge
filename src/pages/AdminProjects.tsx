import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, Briefcase, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill, PillTone } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { useToast } from '../components/admin/ToastProvider';

const STATUS_TONE: Record<string, PillTone> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  COMPLETED: 'info',
  ARCHIVED: 'neutral',
};

export const AdminProjects: React.FC = () => {
  const { t } = useTranslation('admin');
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusLabel = (value: string) => {
    const map: Record<string, string> = {
      DRAFT: t('projectsPage.status.draft'),
      ACTIVE: t('projectsPage.status.active'),
      COMPLETED: t('projectsPage.status.completed'),
      ARCHIVED: t('projectsPage.status.archived'),
    };
    return map[value] || value;
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, sortBy: 'displayOrder', sortOrder: 'asc' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (featuredFilter !== '') params.featured = featuredFilter;

      const res = await api.get('/api/projects', { params });
      if (res.data && res.data.success) {
        setProjects(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, categoryFilter, featuredFilter]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await api.delete(`/api/projects/${id}`);
      setDeleteConfirmId(null);
      showToast(t('projectsPage.deleteSuccess'), 'success');
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      showToast(t('projectsPage.deleteError'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(t('projectsPage.bulkDeleteConfirm', { count: selectedIds.length }))) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/api/projects/${id}`)));
      showToast(t('projectsPage.deleteSuccess'), 'success');
      setSelectedIds([]);
      fetchProjects();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      showToast(t('projectsPage.bulkDeleteError'), 'error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === projects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(projects.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('projectsPage.title')}
        subtitle={t('projectsPage.subtitle')}
        actions={
          <PermissionGuard permission="projects.create">
            <a href="/admin/projects/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('projectsPage.newProject')}
            </a>
          </PermissionGuard>
        }
      />

      <div className="glass dash-card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '14px' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            className="admin-toolbar-input"
            placeholder={t('projectsPage.searchPlaceholder')}
            aria-label={t('projectsPage.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>
        <select className="admin-toolbar-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('projectsPage.allStatuses')}</option>
          <option value="DRAFT">{t('projectsPage.status.draft')}</option>
          <option value="ACTIVE">{t('projectsPage.status.active')}</option>
          <option value="COMPLETED">{t('projectsPage.status.completed')}</option>
          <option value="ARCHIVED">{t('projectsPage.status.archived')}</option>
        </select>
        <input
          type="text"
          className="admin-toolbar-input"
          placeholder={t('projectsPage.categoryPlaceholder')}
          aria-label={t('projectsPage.categoryPlaceholder')}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{ minWidth: '160px' }}
        />
        <select className="admin-toolbar-select" value={featuredFilter} onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}>
          <option value="">{t('projectsPage.allFeatured')}</option>
          <option value="true">{t('projectsPage.featuredOnly')}</option>
          <option value="false">{t('projectsPage.notFeatured')}</option>
        </select>
        {selectedIds.length > 0 && (
          <PermissionGuard permission="projects.delete">
            <button onClick={handleBulkDelete} className="btn btn-danger" style={{ gap: '6px' }}>
              <Trash2 size={13} /> {t('projectsPage.deleteSelected', { count: selectedIds.length })}
            </button>
          </PermissionGuard>
        )}
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" onChange={toggleSelectAll} checked={projects.length > 0 && selectedIds.length === projects.length} />
              </th>
              <th>{t('projectsPage.thProject')}</th>
              <th>{t('projectsPage.thCategory')}</th>
              <th>{t('projectsPage.thStatus')}</th>
              <th>{t('projectsPage.thFeatured')}</th>
              <th>{t('projectsPage.thOrder')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={7} />
            ) : projects.length === 0 ? (
              <EmptyState colSpan={7} icon={<Briefcase size={30} />} message={t('projectsPage.noProjects')} />
            ) : (
              projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelectOne(p.id)} />
                  </td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{p.slug}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{p.category}</td>
                  <td><StatusPill label={statusLabel(p.status)} tone={STATUS_TONE[p.status] || 'neutral'} /></td>
                  <td>
                    {p.featured && (
                      <span style={{ background: 'rgba(192, 132, 252, 0.15)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {t('projectsPage.featuredBadge')}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{p.displayOrder}</td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <PermissionGuard permission="contracts.create">
                        <a href={`/admin/contracts/new?projectId=${p.id}${p.clientId ? `&clientId=${p.clientId}` : ''}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <FileText size={12} /> {t('projectsPage.addContract')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="projects.update">
                        <a href={`/admin/projects/${p.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <Pencil size={12} /> {t('common.edit')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="projects.delete">
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="btn btn-danger btn-xs"
                          style={{ gap: '6px' }}
                        >
                          <Trash2 size={12} /> {t('common.delete')}
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{t('common.pageOf', { page, total: totalPages || 1 })}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '12px', opacity: page === 1 ? 0.5 : 1 }}
            >
              {t('previous')}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '12px', opacity: page >= totalPages ? 0.5 : 1 }}
            >
              {t('next')}
            </button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <DeleteConfirmModal
          title={t('projectsPage.deleteTitle')}
          description={t('projectsPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => handleDelete(deleteConfirmId)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default AdminProjects;
