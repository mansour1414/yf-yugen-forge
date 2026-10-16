import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface ServiceOption { id: string; title: string; }
interface MessageDetails {
  id: string; name: string; email: string; phone?: string | null; company?: string | null; subject?: string | null; message: string; budget?: string | null; status: 'NEW' | 'READ' | 'IN_PROGRESS' | 'REPLIED' | 'ARCHIVED'; isRead: boolean; serviceId?: string | null; service?: ServiceOption | null; createdAt: string;
}

export const AdminMessageDetails: React.FC<{ messageId: string }> = ({ messageId }) => {
  const { t, i18n } = useTranslation('admin');
  const navigate = useNavigate();
  const [message, setMessage] = useState<MessageDetails | null>(null);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [status, setStatus] = useState('READ');
  const [serviceId, setServiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/api/messages/${messageId}`), api.get('/api/messages/services')]).then(([messageResponse, servicesResponse]) => {
      const loaded = messageResponse.data?.data;
      setMessage(loaded);
      setStatus(loaded?.status || 'READ');
      setServiceId(loaded?.serviceId || '');
      setServices(servicesResponse.data?.data || []);
    }).catch((requestError: any) => setError(requestError.response?.data?.error || t('messageDetails.loadError'))).finally(() => setLoading(false));
  }, [messageId]);

  const save = async (nextStatus = status) => {
    try {
      setSaving(true);
      const res = await api.put(`/api/messages/${messageId}`, { status: nextStatus, serviceId: serviceId || null });
      setMessage(res.data?.data);
      setStatus(res.data?.data?.status || nextStatus);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('messageDetails.saveError'));
    } finally { setSaving(false); }
  };

  const remove = async () => {
    try { await api.delete(`/api/messages/${messageId}`); navigate('/admin/messages'); } catch (requestError: any) { setError(requestError.response?.data?.error || t('messageDetails.deleteError')); }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('messageDetails.loadingMessage')}</div>;
  if (!message) return <div style={{ padding: '100px', textAlign: 'center', color: '#f87171' }}>{error || t('messageDetails.notFound')}</div>;

  const info: Array<[string, string]> = [
    [t('messageDetails.email'), message.email],
    [t('messageDetails.phone'), message.phone || '—'],
    [t('messageDetails.company'), message.company || '—'],
    [t('messageDetails.requestedService'), message.service?.title || t('messagesPage.unassigned')],
    [t('messageDetails.budget'), message.budget || '—'],
    [t('messageDetails.received'), new Date(message.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar' : 'en-US')],
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <a href="/admin/messages" style={{ color: 'var(--accent)', fontSize: '13px', display: 'inline-block', marginBottom: '6px' }}>{t('messageDetails.backToMessages')}</a>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{message.subject || t('messageDetails.defaultTitle')}</h2>
        </div>
        <PermissionGuard permission="messages.delete">
          <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)} style={{ gap: '6px' }}>
            <Trash2 size={14} /> {t('common.delete')}
          </button>
        </PermissionGuard>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <article className="glass dash-card" style={{ padding: '30px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{message.name}</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '26px' }}>{message.email}</p>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, color: '#e8e3ee' }}>{message.message}</div>
        </article>
        <aside className="glass dash-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ marginBottom: '14px', fontSize: '15px' }}>{t('messageDetails.inquiryDetails')}</h3>
          {info.map(([label, value]) => (
            <div key={label} style={{ marginBottom: '14px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
              <div style={{ fontSize: '14px', marginTop: '3px', overflowWrap: 'anywhere' }}>{value}</div>
            </div>
          ))}
        </aside>
      </div>

      <PermissionGuard permission="messages.reply">
        <div className="glass dash-card" style={{ padding: '24px', marginTop: '20px', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('messageDetails.status')}</label>
            <select className="admin-toolbar-select" value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: '100%' }}>
              <option value="NEW">{t('messagesPage.status.new')}</option>
              <option value="READ">{t('messagesPage.status.read')}</option>
              <option value="IN_PROGRESS">{t('messagesPage.status.in_progress')}</option>
              <option value="REPLIED">{t('messagesPage.status.replied')}</option>
              <option value="ARCHIVED">{t('messagesPage.status.archived')}</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('messageDetails.assignedService')}</label>
            <select className="admin-toolbar-select" value={serviceId} onChange={(event) => setServiceId(event.target.value)} style={{ width: '100%' }}>
              <option value="">{t('messagesPage.unassigned')}</option>
              {services.map((service) => <option value={service.id} key={service.id}>{service.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" disabled={saving || message.isRead} onClick={() => save('READ')}>{t('messageDetails.markRead')}</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => save()}>{saving ? t('messageDetails.saving') : t('messageDetails.saveChanges')}</button>
          </div>
        </div>
      </PermissionGuard>

      {deleteConfirm && (
        <DeleteConfirmModal
          title={t('messageDetails.deleteTitle')}
          description={t('messageDetails.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
};

export default AdminMessageDetails;
