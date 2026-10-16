import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Handshake,
  Briefcase,
  FileText,
  Mail,
  Bell,
  Image as ImageIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Activity as ActivityIcon,
  TrendingUp,
  TrendingDown,
  LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { DonutChart } from '../components/charts/DonutChart';
import { Alert } from '../components/admin/Alert';

interface MonthlyTrendPoint {
  month: string;
  monthStartIso: string;
  projects: number;
  clients: number;
  messages: number;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
  activeClients: number;
  totalMessages: number;
  unreadMessages: number;
  totalServices: number;
  activeServices: number;
  totalMedia: number;
  totalUsers: number;
  monthlyTrends: MonthlyTrendPoint[];
  recentProjects: Array<{
    id: string;
    title: string;
    status: string;
    category: string;
    createdAt: string;
    client?: { companyName: string };
  }>;
  recentClients: Array<{
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    status: string;
  }>;
  recentMessages: Array<{
    id: string;
    name: string;
    email: string;
    subject?: string;
    isRead: boolean;
    createdAt: string;
  }>;
  latestActivityLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
    user?: { name: string; email: string };
  }>;
}

type Delta =
  | { type: 'up'; percent: number }
  | { type: 'down'; percent: number }
  | { type: 'new'; count: number }
  | { type: 'flat' };

function computeDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    return current > 0 ? { type: 'new', count: current } : { type: 'flat' };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { type: 'flat' };
  return pct > 0 ? { type: 'up', percent: pct } : { type: 'down', percent: Math.abs(pct) };
}

const DeltaPill: React.FC<{ delta: Delta; t: (key: string, opts?: Record<string, unknown>) => string }> = ({ delta, t }) => {
  if (delta.type === 'flat') {
    return <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{t('dashboard.vsLastMonth', { context: 'flat' })}</span>;
  }
  if (delta.type === 'new') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#4ade80', fontWeight: 600 }}>
        <TrendingUp size={12} /> {t('dashboard.addedThisMonth', { count: delta.count })}
      </span>
    );
  }
  const isUp = delta.type === 'up';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: isUp ? '#4ade80' : '#f87171', fontWeight: 600 }}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {t('dashboard.vsLastMonth', { context: delta.type, percent: delta.percent })}
    </span>
  );
};

interface KpiCardProps {
  href?: string;
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconColor: string;
  delta?: React.ReactNode;
  subLabel?: string;
  delayMs?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ href, label, value, icon: Icon, iconColor, delta, subLabel, delayMs = 0 }) => {
  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ color: 'var(--muted)', fontSize: '12.5px', fontWeight: 500 }}>{label}</div>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: `${iconColor}1f`, border: `1px solid ${iconColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0,
        }}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '14px', color: 'var(--text)' }}>{value}</div>
      <div style={{ marginTop: '8px', minHeight: '16px' }}>
        {delta || (subLabel && <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{subLabel}</span>)}
      </div>
    </>
  );

  const style: React.CSSProperties = {
    padding: '20px', borderRadius: '16px', display: 'block',
    textDecoration: 'none', color: 'inherit', animationDelay: `${delayMs}ms`,
  };

  if (href) {
    return <Link to={href} className="glass dash-card dash-kpi-card dash-fade-up" style={style}>{content}</Link>;
  }
  return <div className="glass dash-card dash-kpi-card dash-fade-up" style={style}>{content}</div>;
};

const statusPillStyle = (isPositive: boolean): React.CSSProperties => ({
  padding: '3px 9px', borderRadius: '100px', fontSize: '11px',
  background: isPositive ? 'rgba(74,222,128,.14)' : 'rgba(255,255,255,.06)',
  color: isPositive ? '#4ade80' : 'var(--muted)',
});

export const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation('admin');
  const { user, role, permissions } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [totalContracts, setTotalContracts] = useState<number | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canViewDashboard = role?.name === 'Admin' || permissions.includes('dashboard.view') || permissions.includes('settings.view');
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }

    const dashboardRequest = api.get('/api/dashboard');
    // Contracts and notifications aren't part of the dashboard payload, so we
    // pull their counts from their own existing (already-authorized) endpoints.
    // Every call is settled independently so a missing permission on one
    // doesn't block the rest of the summary from rendering.
    const contractsRequest = api.get('/api/contracts', { params: { limit: 1 } });
    const notificationsRequest = api.get('/api/notifications/unread-count');

    Promise.allSettled([dashboardRequest, contractsRequest, notificationsRequest]).then(([dashboardResult, contractsResult, notificationsResult]) => {
      if (dashboardResult.status === 'fulfilled') {
        setStats(dashboardResult.value.data?.data || null);
      } else {
        setError(t('dashboard.loadError'));
      }
      if (contractsResult.status === 'fulfilled') {
        setTotalContracts(contractsResult.value.data?.pagination?.total ?? null);
      }
      if (notificationsResult.status === 'fulfilled') {
        setUnreadNotifications(notificationsResult.value.data?.data?.count ?? null);
      }
    }).finally(() => setLoading(false));
  }, [permissions, role?.name, t]);

  const monthLabels = useMemo(() => {
    if (!stats?.monthlyTrends) return [];
    const localeTag = i18n.language === 'ar' ? 'ar-u-ca-gregory' : 'en-US';
    return stats.monthlyTrends.map((m) => new Date(m.monthStartIso).toLocaleDateString(localeTag, { month: 'short' }));
  }, [stats?.monthlyTrends, i18n.language]);

  const projectsDelta = useMemo(() => {
    const tr = stats?.monthlyTrends;
    if (!tr || tr.length < 2) return null;
    return computeDelta(tr[tr.length - 1].projects, tr[tr.length - 2].projects);
  }, [stats?.monthlyTrends]);

  const clientsDelta = useMemo(() => {
    const tr = stats?.monthlyTrends;
    if (!tr || tr.length < 2) return null;
    return computeDelta(tr[tr.length - 1].clients, tr[tr.length - 2].clients);
  }, [stats?.monthlyTrends]);

  const messagesDelta = useMemo(() => {
    const tr = stats?.monthlyTrends;
    if (!tr || tr.length < 2) return null;
    return computeDelta(tr[tr.length - 1].messages, tr[tr.length - 2].messages);
  }, [stats?.monthlyTrends]);

  if (loading) {
    return <div style={{ minHeight: '60vh', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.loading')}</div>;
  }

  const hasAttention = (stats?.unreadMessages || 0) > 0 || (unreadNotifications || 0) > 0;

  const actionCards: Array<{ href: string; icon: string; titleKey: string; descKey: string; permission?: string }> = [
    { href: '/admin/pricing', icon: '💰', titleKey: 'dashboard.actionPricing', descKey: 'dashboard.actionPricingDesc', permission: 'pricing.view' },
    { href: '/admin/services', icon: '⚡', titleKey: 'dashboard.actionServices', descKey: 'dashboard.actionServicesDesc', permission: 'services.view' },
    { href: '/admin/hero', icon: '🚀', titleKey: 'dashboard.actionHero', descKey: 'dashboard.actionHeroDesc', permission: 'settings.view' },
    { href: '/admin/projects', icon: '💼', titleKey: 'dashboard.actionProjects', descKey: 'dashboard.actionProjectsDesc', permission: 'projects.view' },
    { href: '/admin/testimonials', icon: '⭐', titleKey: 'dashboard.actionTestimonials', descKey: 'dashboard.actionTestimonialsDesc', permission: 'settings.view' },
    { href: '/admin/media', icon: '🖼️', titleKey: 'dashboard.actionMedia', descKey: 'dashboard.actionMediaDesc', permission: 'media.view' },
    { href: '/admin/clients', icon: '🤝', titleKey: 'dashboard.actionClients', descKey: 'dashboard.actionClientsDesc', permission: 'clients.view' },
    { href: '/admin/contracts', icon: '📄', titleKey: 'dashboard.actionContracts', descKey: 'dashboard.actionContractsDesc', permission: 'contracts.view' },
    { href: '/admin/messages', icon: '✉️', titleKey: 'dashboard.actionMessages', descKey: 'dashboard.actionMessagesDesc', permission: 'messages.view' },
    { href: '/admin/guide', icon: '❓', titleKey: 'dashboard.actionGuide', descKey: 'dashboard.actionGuideDesc' },
  ];

  const actionCard = (action: (typeof actionCards)[number]) => (
    <Link
      key={action.href}
      to={action.href}
      className="glass dash-card"
      style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', color: 'inherit', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
    >
      <span style={{ fontSize: '22px', lineHeight: 1 }}>{action.icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{t(action.titleKey)}</div>
        <div style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '4px', lineHeight: 1.6 }}>{t(action.descKey)}</div>
      </div>
    </Link>
  );

  const statusSegments = stats ? [
    { label: t('projectsPage.status.active'), value: stats.activeProjects, color: '#4ade80' },
    { label: t('projectsPage.status.completed'), value: stats.completedProjects, color: 'var(--primary)' },
    { label: t('dashboard.statusOther'), value: Math.max(0, stats.totalProjects - stats.activeProjects - stats.completedProjects), color: 'var(--muted)' },
  ] : [];

  return (
    <div>
      {/* ترحيب */}
      <div className="glass" style={{ padding: '28px 32px', marginBottom: '28px', borderRadius: '16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 600 }}>{t('dashboard.welcome')}، <span style={{ color: 'var(--accent)' }}>{user?.name}</span></h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '6px' }}>{t('dashboard.subtitle')}</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* بطاقات الملخص (KPI) */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <KpiCard
            href="/admin/clients"
            label={t('dashboard.statClients')}
            value={stats.totalClients}
            icon={Handshake}
            iconColor="#A855F7"
            delta={clientsDelta ? <DeltaPill delta={clientsDelta} t={t} /> : undefined}
            subLabel={`${stats.activeClients} ${t('dashboard.statClientsSub')}`}
            delayMs={0}
          />
          <KpiCard
            href="/admin/projects"
            label={t('dashboard.statProjects')}
            value={stats.totalProjects}
            icon={Briefcase}
            iconColor="#4ade80"
            delta={projectsDelta ? <DeltaPill delta={projectsDelta} t={t} /> : undefined}
            subLabel={`${stats.activeProjects} ${t('dashboard.statProjectsSub', { completed: stats.completedProjects })}`}
            delayMs={40}
          />
          <KpiCard
            href="/admin/contracts"
            label={t('dashboard.statContracts')}
            value={totalContracts ?? '—'}
            icon={FileText}
            iconColor="#38bdf8"
            subLabel={t('dashboard.statContractsSub')}
            delayMs={80}
          />
          <KpiCard
            href="/admin/messages"
            label={t('dashboard.statMessages')}
            value={stats.totalMessages}
            icon={Mail}
            iconColor={stats.unreadMessages > 0 ? '#f59e0b' : '#B3B3B3'}
            delta={messagesDelta ? <DeltaPill delta={messagesDelta} t={t} /> : undefined}
            subLabel={`${stats.unreadMessages} ${t('dashboard.statMessagesSub')}`}
            delayMs={120}
          />
          <KpiCard
            label={t('dashboard.statNotifications')}
            value={unreadNotifications ?? '—'}
            icon={Bell}
            iconColor={(unreadNotifications || 0) > 0 ? '#f59e0b' : '#B3B3B3'}
            subLabel={t('dashboard.statNotificationsSub')}
            delayMs={160}
          />
          <KpiCard
            href="/admin/media"
            label={t('dashboard.statMedia')}
            value={stats.totalMedia}
            icon={ImageIcon}
            iconColor="#f472b6"
            subLabel={t('dashboard.statMediaSub')}
            delayMs={200}
          />
        </div>
      )}

      {/* Charts: نمو النشاط + توزيع حالة المشاريع */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '24px', marginBottom: '28px' }}>
          <div className="glass dash-card" style={{ padding: '26px', borderRadius: '16px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{t('dashboard.trendTitle')}</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{t('dashboard.trendSubtitle')}</p>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} /> {t('dashboard.trendProjects')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} /> {t('dashboard.trendClients')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f472b6' }} /> {t('dashboard.trendMessages')}
                </span>
              </div>
            </div>
            {stats.monthlyTrends && stats.monthlyTrends.length > 0 ? (
              <TrendLineChart
                labels={monthLabels}
                series={[
                  { label: t('dashboard.trendProjects'), color: 'var(--primary)', data: stats.monthlyTrends.map((m) => m.projects) },
                  { label: t('dashboard.trendClients'), color: '#38bdf8', data: stats.monthlyTrends.map((m) => m.clients) },
                  { label: t('dashboard.trendMessages'), color: '#f472b6', data: stats.monthlyTrends.map((m) => m.messages) },
                ]}
              />
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', padding: '40px 0' }}>{t('dashboard.trendEmpty')}</p>
            )}
          </div>

          <div className="glass dash-card" style={{ padding: '26px', borderRadius: '16px', minWidth: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>{t('dashboard.statusDistributionTitle')}</h3>
            {stats.totalProjects > 0 ? (
              <DonutChart
                segments={statusSegments}
                centerLabel={String(stats.totalProjects)}
                centerSubLabel={t('dashboard.statProjects')}
              />
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', padding: '40px 0' }}>{t('dashboard.statusDistributionEmpty')}</p>
            )}
          </div>
        </div>
      )}

      {/* ماذا تريد أن تفعل؟ */}
      <h2 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '16px' }}>{t('dashboard.whatToDoTitle')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {actionCards.map((action) =>
          action.permission ? (
            <PermissionGuard key={action.href} permission={action.permission}>
              {actionCard(action)}
            </PermissionGuard>
          ) : (
            actionCard(action)
          )
        )}
      </div>

      {/* إجراءات سريعة + يحتاج انتباهك */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass dash-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{t('dashboard.quickActionsTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <PermissionGuard permission="clients.create">
              <Link to="/admin/clients/new" className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}><Plus size={14} /> {t('dashboard.quickAddClient')}</Link>
            </PermissionGuard>
            <PermissionGuard permission="projects.create">
              <Link to="/admin/projects/new" className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}><Plus size={14} /> {t('dashboard.quickAddProject')}</Link>
            </PermissionGuard>
            <PermissionGuard permission="contracts.create">
              <Link to="/admin/contracts/new" className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}><Plus size={14} /> {t('dashboard.quickAddContract')}</Link>
            </PermissionGuard>
            <PermissionGuard permission="messages.view">
              <Link to="/admin/messages" className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}><Mail size={14} /> {t('dashboard.quickViewMessages')}</Link>
            </PermissionGuard>
          </div>
        </div>

        <div className="glass dash-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{t('dashboard.attentionTitle')}</h3>
          {hasAttention ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.unreadMessages || 0) > 0 && (
                <Link to="/admin/messages" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', textDecoration: 'none', color: 'var(--text)', fontSize: '13.5px' }}>
                  <AlertTriangle size={15} color="#f59e0b" />
                  <span>{t('dashboard.attentionUnreadMessages', { count: stats?.unreadMessages })}</span>
                </Link>
              )}
              {(unreadNotifications || 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', fontSize: '13.5px' }}>
                  <Bell size={15} color="#f59e0b" />
                  <span>{t('dashboard.attentionUnreadNotifications', { count: unreadNotifications })}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#4ade80" /> {t('dashboard.attentionNone')}
            </p>
          )}
        </div>
      </div>

      {/* أحدث المشاريع والعملاء */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        <div className="glass dash-card" style={{ padding: '26px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={16} color="var(--muted)" /> {t('dashboard.recentProjectsTitle')}</h3>
            <Link to="/admin/projects" style={{ color: 'var(--accent)', fontSize: '12.5px' }}>{t('dashboard.viewAll')}</Link>
          </div>
          {!stats || stats.recentProjects.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', padding: '16px 0' }}>{t('dashboard.noProjects')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '2px' }}>
              {stats.recentProjects.map((p) => (
                <div key={p.id} className="dash-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{p.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '11.5px', marginTop: '2px' }}>{p.client?.companyName || p.category}</div>
                  </div>
                  <span style={statusPillStyle(p.status === 'ACTIVE')}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass dash-card" style={{ padding: '26px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Handshake size={16} color="var(--muted)" /> {t('dashboard.recentClientsTitle')}</h3>
            <Link to="/admin/clients" style={{ color: 'var(--accent)', fontSize: '12.5px' }}>{t('dashboard.viewAll')}</Link>
          </div>
          {!stats || stats.recentClients.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', padding: '16px 0' }}>{t('dashboard.noClients')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '2px' }}>
              {stats.recentClients.map((c) => (
                <div key={c.id} className="dash-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{c.companyName}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '11.5px', marginTop: '2px' }}>{c.contactName}</div>
                  </div>
                  <span style={statusPillStyle(c.status === 'ACTIVE')}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* أحدث الرسائل وسجل النشاط */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        <div className="glass dash-card" style={{ padding: '26px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} color="var(--muted)" /> {t('dashboard.recentMessagesTitle')}</h3>
            <Link to="/admin/messages" style={{ color: 'var(--accent)', fontSize: '12.5px' }}>{t('dashboard.viewAll')}</Link>
          </div>
          {!stats || stats.recentMessages.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', padding: '16px 0' }}>{t('dashboard.noMessages')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '2px' }}>
              {stats.recentMessages.map((m) => (
                <div key={m.id} className="dash-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: m.isRead ? 500 : 700, fontSize: '13.5px' }}>{m.name} {m.subject ? `(${m.subject})` : ''}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '11.5px', marginTop: '2px' }}>{m.email}</div>
                  </div>
                  {!m.isRead && (
                    <span style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px' }}>{t('dashboard.newBadge')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass dash-card" style={{ padding: '26px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ActivityIcon size={16} color="var(--muted)" /> {t('dashboard.activityTitle')}</h3>
          {!stats || stats.latestActivityLogs.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', padding: '16px 0' }}>{t('dashboard.noActivity')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {stats.latestActivityLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', marginTop: '6px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px' }}>
                      <span style={{ fontWeight: 600 }}>{log.user?.name || 'System'}</span> · {log.action} · {log.entity}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
