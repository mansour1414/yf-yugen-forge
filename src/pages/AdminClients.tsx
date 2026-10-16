import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, Handshake } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill, PillTone } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { useToast } from '../components/admin/ToastProvider';
import { Alert } from '../components/admin/Alert';

interface ClientItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  _count?: { projects: number };
}

const STATUS_TONE: Record<ClientItem['status'], PillTone> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  INACTIVE: 'neutral',
};

export const AdminClients: React.FC = () => {
  const { t } = useTranslation('admin');
  const { showToast } = useToast();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get('/api/clients', { params });
      setClients(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('clientsPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const deleteClient = async (id: string) => {
    try {
      setDeleting(true);
      await api.delete(`/api/clients/${id}`);
      setDeleteConfirmId(null);
      showToast(t('clientsPage.deleteSuccess'), 'success');
      fetchClients();
    } catch (requestError: any) {
      const message = requestError.response?.data?.error || t('clientsPage.deleteError');
      setError(message);
      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const statusLabel = (value: ClientItem['status']) => (value === 'ACTIVE' ? t('common.active') : value === 'PENDING' ? t('common.pending') : t('common.inactive'));

  return (
    <div>
      <PageHeader
        title={t('clientsPage.title')}
        subtitle={t('clientsPage.subtitle')}
        actions={
          <PermissionGuard permission="clients.create">
            <a href="/admin/clients/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('clientsPage.newClient')}
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
            placeholder={t('clientsPage.searchPlaceholder')}
            aria-label={t('clientsPage.searchPlaceholder')}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>
        <select className="admin-toolbar-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">{t('common.allStatuses')}</option>
          <option value="ACTIVE">{t('common.active')}</option>
          <option value="PENDING">{t('common.pending')}</option>
          <option value="INACTIVE">{t('common.inactive')}</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('clientsPage.thClient')}</th>
              <th>{t('clientsPage.thContact')}</th>
              <th>{t('clientsPage.thCountry')}</th>
              <th>{t('clientsPage.thProjects')}</th>
              <th>{t('clientsPage.thStatus')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : clients.length === 0 ? (
              <EmptyState colSpan={6} icon={<Handshake size={30} />} message={t('common.noResults')} />
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td><div style={{ fontWeight: 600 }}>{client.companyName}</div><div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{client.email}</div></td>
                  <td><div>{client.contactName}</div><div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{client.phone}</div></td>
                  <td style={{ color: 'var(--muted)' }}>{client.country}</td>
                  <td>{client._count?.projects || 0}</td>
                  <td><StatusPill label={statusLabel(client.status)} tone={STATUS_TONE[client.status]} /></td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <PermissionGuard permission="clients.update">
                        <a href={`/admin/clients/${client.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <Pencil size={12} /> {t('common.edit')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="clients.delete">
                        <button onClick={() => setDeleteConfirmId(client.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
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
            <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t('common.previous')}</button>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{t('common.next')}</button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <DeleteConfirmModal
          title={t('clientsPage.deleteTitle')}
          description={t('clientsPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteClient(deleteConfirmId)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default AdminClients;
