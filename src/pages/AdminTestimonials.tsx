import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  position?: string;
  avatar?: string;
  rating: number;
  content: string;
  featured: boolean;
  displayOrder: number;
}

export const AdminTestimonials: React.FC = () => {
  const { t } = useTranslation('admin');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'displayOrder', sortOrder: 'asc' };
      if (search) params.search = search;
      if (featured) params.featured = featured;
      if (rating) params.rating = rating;
      const res = await api.get('/api/testimonials', { params });
      setTestimonials(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('testimonialsPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [page, search, featured, rating]);

  const deleteTestimonial = async (id: string) => {
    try {
      await api.delete(`/api/testimonials/${id}`);
      setDeleteConfirmId(null);
      fetchTestimonials();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('testimonialsPage.deleteError'));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('testimonialsPage.title')}
        subtitle={t('testimonialsPage.subtitle')}
        actions={
          <PermissionGuard permission="settings.update">
            <a href="/admin/testimonials/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('testimonialsPage.newTestimonial')}
            </a>
          </PermissionGuard>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="glass dash-card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', borderRadius: '14px' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input
            className="admin-toolbar-input"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder={t('testimonialsPage.searchPlaceholder')}
            aria-label={t('testimonialsPage.searchPlaceholder')}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>
        <select className="admin-toolbar-select" value={featured} onChange={(event) => { setFeatured(event.target.value); setPage(1); }}>
          <option value="">{t('testimonialsPage.allFeatured')}</option>
          <option value="true">{t('testimonialsPage.featured')}</option>
          <option value="false">{t('testimonialsPage.notFeatured')}</option>
        </select>
        <select className="admin-toolbar-select" value={rating} onChange={(event) => { setRating(event.target.value); setPage(1); }}>
          <option value="">{t('testimonialsPage.allRatings')}</option>
          <option value="5">{t('testimonialsPage.stars', { count: 5 })}</option>
          <option value="4">{t('testimonialsPage.stars', { count: 4 })}</option>
          <option value="3">{t('testimonialsPage.stars', { count: 3 })}</option>
          <option value="2">{t('testimonialsPage.stars', { count: 2 })}</option>
          <option value="1">{t('testimonialsPage.star', { count: 1 })}</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('testimonialsPage.thAuthor')}</th>
              <th>{t('testimonialsPage.thContent')}</th>
              <th>{t('testimonialsPage.thRating')}</th>
              <th>{t('testimonialsPage.thOrder')}</th>
              <th>{t('testimonialsPage.thFeatured')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : testimonials.length === 0 ? (
              <EmptyState colSpan={6} icon={<Star size={30} />} message={t('testimonialsPage.noTestimonials')} />
            ) : (
              testimonials.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent)' }}>
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{item.company}{item.position ? ` • ${item.position}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{item.content}"
                    </div>
                  </td>
                  <td style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{item.displayOrder}</td>
                  <td>
                    {item.featured && (
                      <span style={{ color: 'var(--accent)', background: 'rgba(192,132,252,.1)', padding: '4px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>
                        {t('testimonialsPage.featuredBadge')}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <a href={`/admin/testimonials/${item.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        <Pencil size={12} /> {t('common.edit')}
                      </a>
                      <button onClick={() => setDeleteConfirmId(item.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
                        <Trash2 size={12} /> {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>{t('previous')}</button>
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{t('common.pageOf', { page, total: totalPages })}</span>
          <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>{t('next')}</button>
        </div>
      )}

      {deleteConfirmId && (
        <DeleteConfirmModal
          title={t('testimonialsPage.deleteTitle')}
          description={t('testimonialsPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteTestimonial(deleteConfirmId)}
        />
      )}
    </div>
  );
};

export default AdminTestimonials;
