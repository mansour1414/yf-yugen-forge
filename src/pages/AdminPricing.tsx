import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface PlanItem {
  id: string;
  tierAr: string;
  tierEn: string;
  price: string;
  isCustom: boolean;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

export const AdminPricing: React.FC = () => {
  const { t } = useTranslation('admin');
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [featured, setFeatured] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'displayOrder', sortOrder: 'asc' };
      if (search) params.search = search;
      if (active) params.active = active;
      if (featured) params.featured = featured;
      const res = await api.get('/api/pricing', { params });
      setPlans(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('pricingPage.loadError'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, [page, search, active, featured]);

  const deletePlan = async (id: string) => {
    try {
      await api.delete(`/api/pricing/${id}`);
      setDeleteConfirmId(null);
      fetchPlans();
    } catch (requestError: any) { setError(requestError.response?.data?.error || t('pricingPage.deleteError')); }
  };

  return (
    <div>
      <PageHeader
        title={t('pricingPage.title')}
        subtitle={t('pricingPage.subtitle')}
        actions={
          <PermissionGuard permission="pricing.create">
            <a href="/admin/pricing/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('pricingPage.newPlan')}
            </a>
          </PermissionGuard>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="glass dash-card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', borderRadius: '14px' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input className="admin-toolbar-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('pricingPage.searchPlaceholder')} aria-label={t('pricingPage.searchPlaceholder')} style={{ width: '100%', border: 'none', background: 'none', padding: 0 }} />
        </div>
        <select className="admin-toolbar-select" value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }}>
          <option value="">{t('pricingPage.allStates')}</option>
          <option value="true">{t('pricingPage.active')}</option>
          <option value="false">{t('pricingPage.inactive')}</option>
        </select>
        <select className="admin-toolbar-select" value={featured} onChange={(event) => { setFeatured(event.target.value); setPage(1); }}>
          <option value="">{t('pricingPage.allFeatured')}</option>
          <option value="true">{t('pricingPage.featured')}</option>
          <option value="false">{t('pricingPage.notFeatured')}</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('pricingPage.thPlan')}</th>
              <th>{t('pricingPage.thPrice')}</th>
              <th>{t('pricingPage.thOrder')}</th>
              <th>{t('pricingPage.thStatus')}</th>
              <th>{t('pricingPage.thFeatured')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : plans.length === 0 ? (
              <EmptyState colSpan={6} icon={<DollarSign size={30} />} message={t('pricingPage.noPlans')} />
            ) : (
              plans.map((plan) => (
                <tr key={plan.id}>
                  <td style={{ fontWeight: 600 }}>{plan.tierAr} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '12px' }}>/ {plan.tierEn}</span></td>
                  <td>{plan.isCustom ? t('pricingPage.customPrice') : plan.price}</td>
                  <td style={{ color: 'var(--muted)' }}>{plan.displayOrder}</td>
                  <td><StatusPill label={plan.active ? t('pricingPage.active') : t('pricingPage.inactive')} tone={plan.active ? 'success' : 'neutral'} /></td>
                  <td>
                    {plan.featured && <span style={{ color: 'var(--accent)', background: 'rgba(192,132,252,.13)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}>{t('pricingPage.featuredBadge')}</span>}
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px' }}>
                      <PermissionGuard permission="pricing.update">
                        <a href={`/admin/pricing/${plan.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <Pencil size={12} /> {t('common.edit')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="pricing.delete">
                        <button onClick={() => setDeleteConfirmId(plan.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
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
          title={t('pricingPage.deleteTitle')}
          description={t('pricingPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deletePlan(deleteConfirmId)}
        />
      )}
    </div>
  );
};

export default AdminPricing;
