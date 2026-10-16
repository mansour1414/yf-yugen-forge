import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { MediaLibraryItem, MediaLibraryModal } from '../components/MediaLibraryModal';
import { PasswordInput } from '../components/PasswordInput';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface RoleItem {
  id: string;
  name: string;
}

export const AdminUserForm: React.FC<{ userId?: string }> = ({ userId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = Boolean(userId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'DISABLED',
    avatar: '',
  });

  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    api.get('/api/users/roles')
      .then((res) => {
        const list = res.data?.data || [];
        setRoles(list);
        if (!isEditing && list.length > 0) {
          setForm((current) => ({ ...current, roleId: list[0].id }));
        }
      })
      .catch(() => {});
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setLoading(false);
      return;
    }
    api.get(`/api/users/${userId}`)
      .then((res) => {
        const user = res.data?.data;
        if (!user) return;
        setForm({
          name: user.name || '',
          email: user.email || '',
          password: '',
          roleId: user.roleId || user.role?.id || '',
          status: user.status || 'ACTIVE',
          avatar: user.avatar || '',
        });
      })
      .catch(() => setError(t('userForm.loadError')))
      .finally(() => setLoading(false));
  }, [isEditing, userId, t]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSelectMedia = (media: MediaLibraryItem) => {
    setForm((current) => ({ ...current, avatar: media.url }));
    setShowMediaModal(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/api/users/${userId}`, {
          name: form.name,
          email: form.email,
          roleId: form.roleId,
          status: form.status,
          avatar: form.avatar || null,
        });
      } else {
        await api.post('/api/users', {
          ...form,
          avatar: form.avatar || null,
        });
      }
      navigate('/admin/users');
    } catch (requestError: any) {
      const errData = requestError.response?.data;
      const errMsg = Array.isArray(errData?.details) ? errData.details.join(', ') : errData?.error || t('userForm.saveError');
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPassword) return;
    setError(null);
    setSuccess(null);
    setResettingPassword(true);
    try {
      await api.put(`/api/users/${userId}/password`, { password: newPassword });
      setNewPassword('');
      setSuccess(t('userForm.passwordUpdated'));
    } catch (requestError: any) {
      const errData = requestError.response?.data;
      const errMsg = Array.isArray(errData?.details) ? errData.details.join(', ') : errData?.error || t('userForm.passwordUpdateError');
      setError(errMsg);
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('userForm.loadingForm')}</div>;
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader title={isEditing ? t('userForm.editTitle') : t('userForm.createTitle')} />

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <form onSubmit={submit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', marginBottom: '30px', borderRadius: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('userForm.fullName')}</label>
              <input required name="name" value={form.name} onChange={change} placeholder={t('userForm.fullNamePlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('userForm.email')}</label>
              <input required type="email" name="email" value={form.email} onChange={change} placeholder={t('userForm.emailPlaceholder')} />
            </div>
          </div>

          {!isEditing && (
            <div className="field" style={{ margin: 0 }}>
              <label>{t('userForm.password')} {t('userForm.passwordHint')}</label>
              <PasswordInput required name="password" value={form.password} onChange={change} placeholder="••••••••" />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('userForm.role')}</label>
              <select name="roleId" value={form.roleId} onChange={change} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)' }}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('userForm.status')}</label>
              <select name="status" value={form.status} onChange={change} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)' }}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('userForm.avatarUrl')}</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="url" name="avatar" value={form.avatar} onChange={change} placeholder="https://..." style={{ flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setShowMediaModal(true)} style={{ whiteSpace: 'nowrap' }}>{t('userForm.selectFromLibrary')}</button>
            </div>
            {form.avatar && (
              <img src={form.avatar} alt={t('userForm.avatarPreviewAlt')} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px', border: '1px solid var(--line)' }} />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <a href="/admin/users" className="btn btn-outline">{t('common.cancel')}</a>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? t('userForm.saving') : isEditing ? t('userForm.updateBtn') : t('userForm.createBtn')}
            </button>
          </div>
        </form>

        {isEditing && (
          <form onSubmit={handleResetPassword} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>{t('userForm.resetPasswordTitle')}</h3>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('userForm.newPassword')}</label>
              <PasswordInput required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }} disabled={resettingPassword}>
                {resettingPassword ? t('userForm.updatingPassword') : t('userForm.updatePasswordBtn')}
              </button>
            </div>
          </form>
        )}

      {showMediaModal && (
        <MediaLibraryModal onClose={() => setShowMediaModal(false)} onSelect={handleSelectMedia} allowedTypes={['image']} />
      )}
    </div>
  );
};

export default AdminUserForm;
