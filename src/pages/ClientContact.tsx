import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Alert } from '../components/admin/Alert';

interface MessageItem {
  id: string;
  subject?: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export const ClientContact: React.FC = () => {
  const { t } = useTranslation('portal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<MessageItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = () => {
    setLoadingHistory(true);
    api.get('/api/client/messages')
      .then((res) => setHistory(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.post('/api/client/messages', { subject: subject.trim() || undefined, message });
      setSuccess(true);
      setSubject('');
      setMessage('');
      fetchHistory();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '6px' }}>{t('contact.title')}</h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px' }}>{t('contact.subtitle')}</p>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{t('contact.sentSuccess')}</Alert>}

      <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px', borderRadius: '16px', marginBottom: '30px' }}>
        <div className="field" style={{ marginTop: 0 }}>
          <label>{t('contact.subjectLabel')}</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('contact.subjectPlaceholder')} />
        </div>
        <div className="field">
          <label>{t('contact.messageLabel')}</label>
          <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('contact.messagePlaceholder')} />
        </div>
        <button type="submit" className="btn btn-primary magnetic" disabled={sending} style={{ marginTop: '10px' }}>
          {sending ? t('contact.sending') : t('contact.send')}
        </button>
      </form>

      <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '14px' }}>{t('contact.historyTitle')}</h2>
      {loadingHistory ? (
        <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>...</div>
      ) : history.length === 0 ? (
        <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>{t('contact.empty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {history.map((m) => (
            <div key={m.id} className="glass" style={{ padding: '16px 20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{m.subject || t('contact.messageLabel')}</span>
                <span style={{ color: 'var(--muted)', fontSize: '11.5px' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px', lineHeight: '1.7' }}>{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientContact;
