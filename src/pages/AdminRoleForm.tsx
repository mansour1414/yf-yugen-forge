import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface PermissionItem {
  id: string;
  name: string;
  description?: string;
}

// Every permission prefix seeded in prisma/seed.ts must be listed here, otherwise its checkboxes
// are never rendered and the permission can't be granted to a custom role from this form.
// ('pricing' and 'contracts' were missing.)
const MODULE_GROUPS = [
  'dashboard',
  'projects',
  'clients',
  'contracts',
  'messages',
  'services',
  'pricing',
  'media',
  'settings',
  'users',
  'invoices',
] as const;

export const AdminRoleForm: React.FC<{ roleId?: string }> = ({ roleId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = Boolean(roleId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const permsRes = await api.get('/api/roles/permissions');
        setAllPermissions(permsRes.data?.data || []);

        if (isEditing) {
          const roleRes = await api.get(`/api/roles/${roleId}`);
          const role = roleRes.data?.data;
          if (role) {
            setForm({
              name: role.name || '',
              description: role.description || '',
            });
            const assigned = (role.permissions || []).map((p: any) => p.permission?.id || p.permissionId);
            setSelectedPermissionIds(assigned);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || t('roleForm.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEditing, roleId, t]);

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleGroup = (moduleName: string) => {
    const groupPermIds = allPermissions
      .filter((p) => getPermissionModule(p.name) === moduleName)
      .map((p) => p.id);

    const allSelected = groupPermIds.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((current) => current.filter((id) => !groupPermIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedPermissionIds, ...groupPermIds]));
      setSelectedPermissionIds(merged);
    }
  };

  const getPermissionModule = (permName: string): string => {
    const prefix = permName.split('.')[0].toLowerCase();
    return (MODULE_GROUPS as readonly string[]).includes(prefix) ? prefix : 'other';
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/api/roles/${roleId}`, {
          name: form.name,
          description: form.description || null,
        });
        await api.put(`/api/roles/${roleId}/permissions`, {
          permissionIds: selectedPermissionIds,
        });
      } else {
        await api.post('/api/roles', {
          name: form.name,
          description: form.description || null,
          permissionIds: selectedPermissionIds,
        });
      }
      navigate('/admin/roles');
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('roleForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('roleForm.loadingForm')}</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader title={isEditing ? t('roleForm.editTitle') : t('roleForm.createTitle')} />

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={submit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '26px', borderRadius: '18px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('roleForm.name')}</label>
            <input required name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('roleForm.namePlaceholder')} />
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('roleForm.description')}</label>
            <textarea name="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('roleForm.descriptionPlaceholder')} />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{t('roleForm.permissionsMatrix')}</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              {MODULE_GROUPS.map((moduleName) => {
                const groupPerms = allPermissions.filter((p) => getPermissionModule(p.name) === moduleName);
                if (groupPerms.length === 0) return null;
                const allChecked = groupPerms.every((p) => selectedPermissionIds.includes(p.id));

                return (
                  <div key={moduleName} className="glass dash-card" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                      {/* roleForm.modules.* has no entries for pricing/contracts; fall back to the sidebar
                          label (nav.pricing / nav.contracts), which exists in both languages. */}
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>{t(`roleForm.modules.${moduleName}`, { defaultValue: t(`nav.${moduleName}`) })}</h4>
                      <button type="button" onClick={() => toggleGroup(moduleName)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>
                        {allChecked ? t('roleForm.deselectAll') : t('roleForm.selectAll')}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {groupPerms.map((perm) => (
                        <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={selectedPermissionIds.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <span>{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <a href="/admin/roles" className="btn btn-outline">{t('common.cancel')}</a>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? t('roleForm.saving') : isEditing ? t('roleForm.updateBtn') : t('roleForm.createBtn')}
            </button>
          </div>
        </form>
    </div>
  );
};

export default AdminRoleForm;
