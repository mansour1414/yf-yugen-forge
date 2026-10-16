import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill, PillTone } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { useToast } from '../components/admin/ToastProvider';
import { Alert } from '../components/admin/Alert';

interface ContractItem {
  id: string;
  contractNumber: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED';
  createdAt: string;
  client: { id: string; companyName: string; contactName: string };
  project: { id: string; title: string } | null;
}

const STATUS_TONE: Record<ContractItem['status'], PillTone> = {
  DRAFT: 'neutral',
  SENT: 'warning',
  SIGNED: 'success',
  CANCELLED: 'danger',
};

export const AdminContracts: React.FC = () => {
  const { t } = useTranslation('admin');
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusLabel = (value: ContractItem['status']) => {
    const map: Record<string, string> = {
      DRAFT: t('contractsPage.status.draft'),
      SENT: t('contractsPage.status.sent'),
      SIGNED: t('contractsPage.status.signed'),
      CANCELLED: t('contractsPage.status.cancelled'),
    };
    return map[value] || value;
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get('/api/contracts', { params });
      setContracts(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('contractsPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const deleteContract = async (id: string) => {
    try {
      setDeleting(true);
      await api.delete(`/api/contracts/${id}`);
      setDeleteConfirmId(null);
      showToast(t('contractsPage.deleteSuccess'), 'success');
      fetchContracts();
    } catch (requestError: any) {
      const message = requestError.response?.data?.error || t('contractsPage.deleteError');
      setError(message);
      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('contractsPage.title')}
        subtitle={t('contractsPage.subtitle')}
        actions={
          <PermissionGuard permission="contracts.create">
            <a href="/admin/contracts/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('contractsPage.newContract')}
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
            placeholder={t('contractsPage.searchPlaceholder')}
            aria-label={t('contractsPage.searchPlaceholder')}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>
        <select className="admin-toolbar-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">{t('contractsPage.allStatuses')}</option>
          <option value="DRAFT">{t('contractsPage.status.draft')}</option>
          <option value="SENT">{t('contractsPage.status.sent')}</option>
          <option value="SIGNED">{t('contractsPage.status.signed')}</option>
          <option value="CANCELLED">{t('contractsPage.status.cancelled')}</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('contractsPage.thNumber')}</th>
              <th>{t('contractsPage.thClient')}</th>
              <th>{t('contractsPage.thProject')}</th>
              <th>{t('contractsPage.thAmount')}</th>
              <th>{t('contractsPage.thStatus')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : contracts.length === 0 ? (
              <EmptyState colSpan={6} icon={<FileText size={30} />} message={t('contractsPage.noContracts')} />
            ) : (
              contracts.map((c) => (
                <tr key={c.id}>
                  <td><div style={{ fontWeight: 600 }}>{c.contractNumber}</div><div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{c.title}</div></td>
                  <td><div>{c.client?.companyName}</div><div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{c.client?.contactName}</div></td>
                  <td style={{ color: 'var(--muted)' }}>{c.project?.title || '—'}</td>
                  <td>{c.totalAmount.toLocaleString()} {c.currency}</td>
                  <td><StatusPill label={statusLabel(c.status)} tone={STATUS_TONE[c.status]} /></td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <a href={`/admin/contracts/${c.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        <Pencil size={12} /> {t('contractsPage.viewEdit')}
                      </a>
                      <PermissionGuard permission="contracts.delete">
                        <button onClick={() => setDeleteConfirmId(c.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
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
            <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>{t('previous')}</button>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>{t('next')}</button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <DeleteConfirmModal
          title={t('contractsPage.deleteTitle')}
          description={t('contractsPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteContract(deleteConfirmId)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default AdminContracts;
