import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Mail, Eye, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusPill, PillTone } from '../components/admin/StatusPill';
import { TableSkeleton } from '../components/admin/TableSkeleton';
import { EmptyState } from '../components/admin/EmptyState';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Alert } from '../components/admin/Alert';

interface ServiceOption { id: string; title: string; }
interface MessageItem {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  subject?: string | null;
  message: string;
  status: 'NEW' | 'READ' | 'IN_PROGRESS' | 'REPLIED' | 'ARCHIVED';
  isRead: boolean;
  service?: ServiceOption | null;
  createdAt: string;
}

const STATUS_TONE: Record<MessageItem['status'], PillTone> = {
  NEW: 'info',
  READ: 'neutral',
  IN_PROGRESS: 'warning',
  REPLIED: 'success',
  ARCHIVED: 'neutral',
};

export const AdminMessages: React.FC = () => {
  const { t, i18n } = useTranslation('admin');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [isRead, setIsRead] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const statusLabel = (value: MessageItem['status']) => {
    const map: Record<string, string> = {
      NEW: t('messagesPage.status.new'),
      READ: t('messagesPage.status.read'),
      IN_PROGRESS: t('messagesPage.status.in_progress'),
      REPLIED: t('messagesPage.status.replied'),
      ARCHIVED: t('messagesPage.status.archived'),
    };
    return map[value] || value;
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 12, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (status) params.status = status;
      if (serviceId) params.serviceId = serviceId;
      if (isRead) params.isRead = isRead;
      const res = await api.get('/api/messages', { params });
      setMessages(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('messagesPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/api/messages/services').then((res) => setServices(res.data?.data || [])).catch(() => setServices([]));
  }, []);

  useEffect(() => { fetchMessages(); }, [page, search, status, serviceId, isRead]);

  const deleteMessage = async (id: string) => {
    try {
      await api.delete(`/api/messages/${id}`);
      setDeleteConfirmId(null);
      fetchMessages();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('messagesPage.deleteError'));
    }
  };

  return (
    <div>
      <PageHeader title={t('messagesPage.title')} subtitle={t('messagesPage.subtitle')} />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="glass dash-card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', borderRadius: '14px' }}>
        <div style={{ flex: 1, minWidth: '230px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input className="admin-toolbar-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('messagesPage.searchPlaceholder')} aria-label={t('messagesPage.searchPlaceholder')} style={{ width: '100%', border: 'none', background: 'none', padding: 0 }} />
        </div>
        <select className="admin-toolbar-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">{t('messagesPage.allStatuses')}</option>
          <option value="NEW">{t('messagesPage.status.new')}</option>
          <option value="READ">{t('messagesPage.status.read')}</option>
          <option value="IN_PROGRESS">{t('messagesPage.status.in_progress')}</option>
          <option value="REPLIED">{t('messagesPage.status.replied')}</option>
          <option value="ARCHIVED">{t('messagesPage.status.archived')}</option>
        </select>
        <select className="admin-toolbar-select" value={serviceId} onChange={(event) => { setServiceId(event.target.value); setPage(1); }}>
          <option value="">{t('messagesPage.allServices')}</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
        </select>
        <select className="admin-toolbar-select" value={isRead} onChange={(event) => { setIsRead(event.target.value); setPage(1); }}>
          <option value="">{t('messagesPage.allReadStates')}</option>
          <option value="false">{t('messagesPage.unread')}</option>
          <option value="true">{t('messagesPage.read')}</option>
        </select>
      </div>

      <div className="glass dash-card" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th>{t('messagesPage.thSender')}</th>
              <th>{t('messagesPage.thSubject')}</th>
              <th>{t('messagesPage.thService')}</th>
              <th>{t('messagesPage.thStatus')}</th>
              <th>{t('messagesPage.thReceived')}</th>
              <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : messages.length === 0 ? (
              <EmptyState colSpan={6} icon={<Mail size={30} />} message={t('messagesPage.noMessages')} />
            ) : (
              messages.map((message) => (
                <tr key={message.id} style={{ background: message.isRead ? 'transparent' : 'rgba(168,85,247,.055)' }}>
                  <td>
                    <div style={{ fontWeight: message.isRead ? 500 : 700 }}>
                      {!message.isRead && <span style={{ display: 'inline-block', width: '7px', height: '7px', background: 'var(--accent)', borderRadius: '50%', marginInlineEnd: '8px' }} />}
                      {message.name}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '3px' }}>{message.email}{message.company ? ` · ${message.company}` : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: message.isRead ? 500 : 700 }}>{message.subject || t('messagesPage.noSubject')}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '240px', marginTop: '3px' }}>{message.message}</div>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{message.service?.title || t('messagesPage.unassigned')}</td>
                  <td><StatusPill label={statusLabel(message.status)} tone={STATUS_TONE[message.status]} /></td>
                  <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(message.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US')}</td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px' }}>
                      <a href={`/admin/messages/${message.id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        <Eye size={12} /> {t('messagesPage.open')}
                      </a>
                      <PermissionGuard permission="messages.delete">
                        <button onClick={() => setDeleteConfirmId(message.id)} className="btn btn-danger btn-xs" style={{ gap: '6px' }}>
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
            <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t('previous')}</button>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{t('next')}</button>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <DeleteConfirmModal
          title={t('messagesPage.deleteTitle')}
          description={t('messagesPage.deleteDesc')}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.delete')}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteMessage(deleteConfirmId)}
        />
      )}
    </div>
  );
};

export default AdminMessages;
