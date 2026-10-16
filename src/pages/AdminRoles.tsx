import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  _count?: { users: number; permissions: number };
  permissions: Array<{ permission: { id: string; name: string } }>;
  createdAt: string;
}

export const AdminRoles: React.FC = () => {
  const { t } = useTranslation('admin');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'name', sortOrder: 'asc' };
      if (search) params.search = search;
      const res = await api.get('/api/roles', { params });
      setRoles(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('rolesPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [page, search]);

  const deleteRole = async (id: string) => {
    try {
      await api.delete(`/api/roles/${id}`);
      setDeleteConfirmId(null);
      fetchRoles();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('rolesPage.deleteError'));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('rolesPage.title')}
        actions={
          <PermissionGuard permission="users.create">
            <a href="/admin/roles/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('rolesPage.newRole')}
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('rolesPage.searchPlaceholder')}
            aria-label={t('rolesPage.searchPlaceholder')}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('rolesPage.thName')}</th>
              <th>{t('rolesPage.thDescription')}</th>
              <th>{t('rolesPage.thUsers')}</th>
              <th>{t('rolesPage.thPermissions')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={5} />
            ) : roles.length === 0 ? (
              <EmptyState colSpan={5} icon={<ShieldCheck size={30} />} message={t('rolesPage.noRoles')} />
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td style={{ fontWeight: 600 }}>
                    {role.name}
                    {role.name === 'Admin' && (
                      <span style={{ marginInlineStart: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'rgba(192,132,252,.2)', color: 'var(--accent)' }}>{t('rolesPage.systemBadge')}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{role.description || '—'}</td>
                  <td>{role._count?.users || 0}</td>
                  <td>{role._count?.permissions || role.permissions?.length || 0}</td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <PermissionGuard permission="users.update">
                        <a href={`/admin/roles/${role.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <Pencil size={12} /> {t('common.edit')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="users.delete">
                        {role.name !== 'Admin' && (
                          <button onClick={() => setDeleteConfirmId(role.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
                            <Trash2 size={12} /> {t('common.delete')}
                          </button>
                        )}
                      </PermissionGuard>
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
          title={t('rolesPage.deleteTitle')}
          description={t('rolesPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteRole(deleteConfirmId)}
        />
      )}
    </div>
  );
};

export default AdminRoles;
