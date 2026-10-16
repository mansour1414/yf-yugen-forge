import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Alert } from '../components/admin/Alert';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const ClientOverview: React.FC = () => {
  const { t } = useTranslation('portal');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/api/notifications')
      .then((res) => setNotifications(res.data?.data || []))
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch { /* non-critical, ignore */ }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    } catch { /* non-critical, ignore */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>{t('overview.title')}</h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-outline" style={{ fontSize: '12.5px', padding: '8px 16px' }}>{t('overview.markAllRead')}</button>
        )}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>...</div>
      ) : notifications.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>{t('overview.empty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="glass"
              onClick={() => !n.isRead && markAsRead(n.id)}
              style={{ padding: '18px 22px', borderRadius: '14px', cursor: n.isRead ? 'default' : 'pointer', background: n.isRead ? undefined : 'rgba(168,85,247,.06)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ fontWeight: n.isRead ? 500 : 700 }}>
                  {!n.isRead && <span style={{ display: 'inline-block', width: '7px', height: '7px', background: 'var(--accent)', borderRadius: '50%', marginInlineEnd: '8px' }} />}
                  {n.title}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '6px', lineHeight: '1.7' }}>{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientOverview;
