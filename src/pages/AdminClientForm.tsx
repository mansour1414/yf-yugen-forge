import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface AdminClientFormProps {
  clientId?: string;
}

export const AdminClientForm: React.FC<AdminClientFormProps> = ({ clientId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = Boolean(clientId);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', country: '', website: '', notes: '', status: 'ACTIVE' });

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/api/clients/${clientId}`).then((res) => {
      const client = res.data?.data;
      if (!client) return;
      setForm({ companyName: client.companyName || '', contactName: client.contactName || '', email: client.email || '', phone: client.phone || '', country: client.country || '', website: client.website || '', notes: client.notes || '', status: client.status || 'ACTIVE' });
    }).catch(() => setError(t('clientForm.loadError'))).finally(() => setLoading(false));
  }, [clientId, isEditing, t]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...form, website: form.website || null, notes: form.notes || null };
      if (isEditing) {
        await api.put(`/api/clients/${clientId}`, payload);
        navigate('/admin/clients');
      } else {
        const res = await api.post('/api/clients', payload);
        setTemporaryPassword(res.data?.data?.temporaryPassword || null);
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('clientForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('clientForm.loading')}</div>;

  return (
    <div>
      <PageHeader title={isEditing ? t('clientForm.editTitle') : t('clientForm.createTitle')} />
      {error && <Alert tone="error">{error}</Alert>}
      {temporaryPassword ? (
        <div className="glass dash-card" style={{ padding: '32px', maxWidth: '620px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>{t('clientForm.createdTitle')}</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{t('clientForm.createdDesc')}</p>
          <div style={{ margin: '20px 0', padding: '16px', borderRadius: '10px', background: 'rgba(168,85,247,.12)', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '1px', wordBreak: 'break-all' }}>{temporaryPassword}</div>
          <button className="btn btn-primary" onClick={() => navigate('/admin/clients')}>{t('common.backTo')} {t('nav.clients')}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="glass" style={{ padding: '32px', display: 'grid', gap: '22px', borderRadius: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}><label>{t('clientForm.companyName')} *</label><input required name="companyName" value={form.companyName} onChange={change} /></div>
            <div className="field" style={{ margin: 0 }}><label>{t('clientForm.contactName')} *</label><input required name="contactName" value={form.contactName} onChange={change} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}><label>{t('emailLabel')} *</label><input required type="email" name="email" value={form.email} onChange={change} /></div>
            <div className="field" style={{ margin: 0 }}><label>{t('phoneLabel')} *</label><input required name="phone" value={form.phone} onChange={change} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}><label>{t('countryLabel')} *</label><input required name="country" value={form.country} onChange={change} /></div>
            <div className="field" style={{ margin: 0 }}><label>{t('clientForm.status')}</label><select name="status" value={form.status} onChange={change} style={{ width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '14px 16px', color: 'var(--text)' }}><option value="ACTIVE">{t('common.active')}</option><option value="PENDING">{t('common.pending')}</option><option value="INACTIVE">{t('common.inactive')}</option></select></div>
          </div>
          <div className="field" style={{ margin: 0 }}><label>{t('clientForm.website')}</label><input type="url" name="website" value={form.website} onChange={change} placeholder="https://..." /></div>
          <div className="field" style={{ margin: 0 }}><label>{t('clientForm.notes')}</label><textarea name="notes" rows={4} value={form.notes} onChange={change} placeholder={t('clientForm.notesPlaceholder')} /></div>
          {!isEditing && <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{t('clientForm.createHint')}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <a className="btn btn-outline" href="/admin/clients">{t('common.cancel')}</a>
            <button className="btn btn-primary" disabled={submitting}>{submitting ? t('common.saving') : isEditing ? t('clientForm.updateBtn') : t('clientForm.createBtn')}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminClientForm;
