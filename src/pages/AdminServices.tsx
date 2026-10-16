import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

export const AdminServices: React.FC = () => {
  const { t } = useTranslation('admin');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [featured, setFeatured] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'displayOrder', sortOrder: 'asc' };
      if (search) params.search = search;
      if (active) params.active = active;
      if (featured) params.featured = featured;
      const res = await api.get('/api/services', { params });
      setServices(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('servicesPage.loadError'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, [page, search, active, featured]);

  const deleteService = async (id: string) => {
    try {
      await api.delete(`/api/services/${id}`);
      setDeleteConfirmId(null);
      fetchServices();
    } catch (requestError: any) { setError(requestError.response?.data?.error || t('servicesPage.deleteError')); }
  };

  return (
    <div>
      <PageHeader
        title={t('servicesPage.title')}
        subtitle={t('servicesPage.subtitle')}
        actions={
          <PermissionGuard permission="services.create">
            <a href="/admin/services/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('servicesPage.newService')}
            </a>
          </PermissionGuard>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="glass dash-card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', borderRadius: '14px' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input className="admin-toolbar-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('servicesPage.searchPlaceholder')} aria-label={t('servicesPage.searchPlaceholder')} style={{ width: '100%', border: 'none', background: 'none', padding: 0 }} />
        </div>
        <select className="admin-toolbar-select" value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }}>
          <option value="">{t('servicesPage.allStates')}</option>
          <option value="true">{t('servicesPage.active')}</option>
          <option value="false">{t('servicesPage.inactive')}</option>
        </select>
        <select className="admin-toolbar-select" value={featured} onChange={(event) => { setFeatured(event.target.value); setPage(1); }}>
          <option value="">{t('servicesPage.allFeatured')}</option>
          <option value="true">{t('servicesPage.featured')}</option>
          <option value="false">{t('servicesPage.notFeatured')}</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('servicesPage.thService')}</th>
              <th>{t('servicesPage.thIconColor')}</th>
              <th>{t('servicesPage.thOrder')}</th>
              <th>{t('servicesPage.thStatus')}</th>
              <th>{t('servicesPage.thFeatured')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : services.length === 0 ? (
              <EmptyState colSpan={6} icon={<Zap size={30} />} message={t('servicesPage.noServices')} />
            ) : (
              services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{service.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '3px' }}>{service.description}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: service.color, border: '1px solid var(--line)' }} />
                      {service.icon}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{service.displayOrder}</td>
                  <td><StatusPill label={service.active ? t('servicesPage.active') : t('servicesPage.inactive')} tone={service.active ? 'success' : 'neutral'} /></td>
                  <td>
                    {service.featured && <span style={{ color: 'var(--accent)', background: 'rgba(192,132,252,.13)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}>{t('servicesPage.featuredBadge')}</span>}
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px' }}>
                      <PermissionGuard permission="services.update">
                        <a href={`/admin/services/${service.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <Pencil size={12} /> {t('common.edit')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="services.delete">
                        <button onClick={() => setDeleteConfirmId(service.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
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
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{t('common.pageOf', { page, total: totalPages })}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t('previous')}</button>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{t('next')}</button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <DeleteConfirmModal
          title={t('servicesPage.deleteTitle')}
          description={t('servicesPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteService(deleteConfirmId)}
        />
      )}
    </div>
  );
};

export default AdminServices;
