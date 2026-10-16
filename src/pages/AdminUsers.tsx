import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'ACTIVE' | 'DISABLED';
  lastLogin?: string;
  role: { id: string; name: string };
  createdAt: string;
}

interface RoleItem {
  id: string;
  name: string;
}

export const AdminUsers: React.FC = () => {
  const { t } = useTranslation('admin');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/api/users/roles');
      setRoles(res.data?.data || []);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (roleId) params.roleId = roleId;
      if (status) params.status = status;
      const res = await api.get('/api/users', { params });
      setUsers(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('usersPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleId, status]);

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/api/users/${id}`);
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('usersPage.deleteError'));
    }
  };

  const toggleStatus = async (user: UserItem) => {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.put(`/api/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('usersPage.statusError'));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('users')}
        actions={
          <PermissionGuard permission="users.create">
            <a href="/admin/users/new" className="btn btn-primary" style={{ gap: '8px', display: 'inline-flex', alignItems: 'center' }}>
              <Plus size={15} /> {t('newUser')}
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
            placeholder={t('searchUsers')}
            aria-label={t('searchUsers')}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>
        <select className="admin-toolbar-select" value={roleId} onChange={(e) => { setRoleId(e.target.value); setPage(1); }}>
          <option value="">{t('allRoles')}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select className="admin-toolbar-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('allStatuses')}</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('thUser')}</th>
              <th>{t('thRole')}</th>
              <th>{t('thStatus')}</th>
              <th>{t('thLastLogin')}</th>
              <th style={{ textAlign: 'left' }}>{t('thActions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={5} />
            ) : users.length === 0 ? (
              <EmptyState colSpan={5} icon={<UsersIcon size={30} />} message={t('noUsers')} />
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent)' }}>
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: 'rgba(168,85,247,.15)', color: 'var(--accent)' }}>
                      {u.role?.name || 'User'}
                    </span>
                  </td>
                  <td><StatusPill label={u.status} tone={u.status === 'ACTIVE' ? 'success' : 'danger'} /></td>
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : t('never')}
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                      <button onClick={() => toggleStatus(u)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        {u.status === 'ACTIVE' ? t('disable') : t('enable')}
                      </button>
                      <PermissionGuard permission="users.update">
                        <a href={`/admin/users/${u.id}/edit`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          <Pencil size={12} /> {t('edit')}
                        </a>
                      </PermissionGuard>
                      <PermissionGuard permission="users.delete">
                        <button onClick={() => setDeleteConfirmId(u.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
                          <Trash2 size={12} /> {t('delete')}
                        </button>
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
          title={t('deleteUserTitle')}
          description={t('deleteUserDesc')}
          cancelLabel={t('cancel')}
          confirmLabel={t('delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteUser(deleteConfirmId)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
