import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  HelpCircle,
  Handshake,
  Briefcase,
  FileText,
  Mail,
  DollarSign,
  Zap,
  Rocket,
  Star,
  Image as ImageIcon,
  Users,
  ShieldCheck,
  Settings,
  Search,
  Bell,
  X,
  Menu as MenuIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Loading } from './Loading';
import { CustomCursor } from './CustomCursor';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ForcePasswordChangeGate } from './ForcePasswordChangeGate';

interface ProtectedRouteProps {
  children: ReactNode;
}

interface NotificationItem {
  id: string;
  type: 'CONTRACT' | 'MESSAGE' | 'GENERAL' | 'SYSTEM';
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, role, logout } = useAuth();
  const { t, i18n } = useTranslation('admin');
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = window.location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifWrapRef = useRef<HTMLDivElement>(null);

  // Close either dropdown when clicking outside of it.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll the unread notification count so the bell badge stays fresh across
  // every admin page (this component wraps all of them).
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const fetchUnread = () => {
      api.get('/api/notifications/unread-count')
        .then((res) => {
          if (!cancelled) setUnreadCount(res.data?.data?.count ?? 0);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated]);

  const openNotifications = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && notifications === null) {
      setNotifLoading(true);
      api.get('/api/notifications', { params: { limit: 8 } })
        .then((res) => setNotifications(res.data?.data || []))
        .catch(() => setNotifications([]))
        .finally(() => setNotifLoading(false));
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      api.put(`/api/notifications/${n.id}/read`).catch(() => {});
      setNotifications((prev) => prev ? prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item) : prev);
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = () => {
    api.put('/api/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev ? prev.map((item) => ({ ...item, isRead: true })) : prev);
    setUnreadCount(0);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    window.location.href = '/admin/login';
    return <Loading />;
  }

  // Defense in depth: a Client-role account should never see the staff CMS shell,
  // even if they type an /admin/* URL directly.
  if (role?.name === 'Client') {
    window.location.href = '/account';
    return <Loading />;
  }

  if (user?.mustChangePassword) {
    return <ForcePasswordChangeGate />;
  }

  const navGroups = [
    {
      label: t('sidebar.groupMain'),
      items: [
        { href: '/admin/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/admin/guide', label: t('nav.guide'), icon: HelpCircle },
      ],
    },
    {
      label: t('sidebar.groupClients'),
      items: [
        { href: '/admin/clients', label: t('nav.clients'), icon: Handshake },
        { href: '/admin/projects', label: t('nav.projects'), icon: Briefcase },
        { href: '/admin/contracts', label: t('nav.contracts'), icon: FileText },
      ],
    },
    {
      label: t('sidebar.groupCommunication'),
      items: [
        { href: '/admin/messages', label: t('nav.messages'), icon: Mail },
      ],
    },
    {
      label: t('sidebar.groupContent'),
      items: [
        { href: '/admin/pricing', label: t('nav.pricing'), icon: DollarSign },
        { href: '/admin/services', label: t('nav.services'), icon: Zap },
        { href: '/admin/hero', label: t('nav.hero'), icon: Rocket },
        { href: '/admin/testimonials', label: t('nav.testimonials'), icon: Star },
        { href: '/admin/media', label: t('nav.media'), icon: ImageIcon },
      ],
    },
    {
      label: t('sidebar.groupAdmin'),
      items: [
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/roles', label: t('nav.roles'), icon: ShieldCheck },
        { href: '/admin/settings', label: t('nav.settings'), icon: Settings },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
  const currentNavItem = allNavItems.find((item) => pathname.startsWith(item.href));
  const pageTitle = currentNavItem?.label || t('nav.dashboard');
  const pageGroup = currentNavItem?.group || t('sidebar.groupMain');

  // Plain derived value, deliberately NOT a hook. This used to be a useMemo placed after the early
  // returns above, so the hook count changed between the loading render and the loaded render
  // ("Rendered more hooks than during the previous render" on a hard refresh of any /admin page).
  // The list is ~16 items and allNavItems is rebuilt every render anyway, so memoizing bought nothing.
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch
    ? allNavItems.filter((item) => item.label.toLowerCase().includes(normalizedSearch)).slice(0, 8)
    : [];

  const goToResult = (href: string) => {
    setSearchQuery('');
    setSearchFocused(false);
    setSidebarOpen(false);
    navigate(href);
  };

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return i18n.language === 'ar' ? 'الآن' : 'now';
    if (mins < 60) return i18n.language === 'ar' ? `قبل ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return i18n.language === 'ar' ? `قبل ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return i18n.language === 'ar' ? `قبل ${days} يوم` : `${days}d ago`;
  };

  return (
    <>
      <div className="noise"></div>
      <CustomCursor />
      <img src="/hero-bg.jpg" alt="YF Studio Background" id="bgImageLayer" />
      <div className="bg-overlay-veil"></div>
      <div className="bg-grid"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={18} /> : <MenuIcon size={18} />}
        </button>
        {sidebarOpen && <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* SIDEBAR — sits at the layout's inline-start edge: physically on
            the RIGHT under dir="rtl" and on the LEFT under dir="ltr". Using
            `insetInlineStart` (a CSS logical property) instead of a
            hardcoded `right: 0` is what makes it flip automatically with
            direction instead of staying glued to the physical right edge
            when the language switches to English. */}
        <aside className={`glass admin-sidebar ${sidebarOpen ? 'is-open' : ''}`} style={{
          width: '280px',
          marginTop: '20px',
          marginBottom: '20px',
          marginInlineStart: '20px',
          marginInlineEnd: 0,
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          insetInlineStart: 0,
          zIndex: 50,
          borderRadius: '24px',
          overflow: 'hidden',
        }}>
          {/* Brand header — fixed height, never shrinks or scrolls. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '24px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.svg" alt="YF Studio" style={{ height: '34px', filter: 'drop-shadow(0 0 10px rgba(168,85,247,.35)) brightness(1.2)' }} />
              <span className="en" style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '1px', background: 'linear-gradient(135deg, #fff, var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YF STUDIO</span>
            </Link>
          </div>

          {/* Navigation — the ONLY flexible section: `flex: 1` claims
              exactly the space left after the header and footer are laid
              out, and `minHeight: 0` (required for a flex child to be
              allowed to shrink below its content size) lets its own
              `overflow-y: auto` take over instead of the old
              `maxHeight: calc(100vh - 240px)` guess, which didn't account
              for the account panel's real height and let it get squeezed
              against the sidebar's bottom edge on shorter viewports. */}
          <nav style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '18px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto', paddingInlineEnd: '4px' }}>
            {navGroups.map((group) => (
              <div key={group.label}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.06em', color: 'var(--muted)', opacity: 0.7, padding: '0 18px 8px', textTransform: 'uppercase' }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 18px',
                          borderRadius: '14px',
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'var(--text)' : 'var(--muted)',
                          background: isActive ? 'linear-gradient(135deg, rgba(168,85,247,0.22), rgba(124,58,237,0.08))' : 'transparent',
                          border: isActive ? '1px solid rgba(216,180,254,0.35)' : '1px solid transparent',
                          boxShadow: isActive ? '0 8px 30px rgba(168,85,247,0.25)' : 'none',
                          transition: 'all 0.3s var(--ease-premium)',
                          textDecoration: 'none',
                        })}
                      >
                        {({ isActive }) => (
                          <>
                            <span className="admin-nav-icon" style={{ opacity: isActive ? 1 : 0.75 }}>
                              <Icon size={17} strokeWidth={2} />
                            </span>
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Account panel — fixed height, never shrinks, always fully
              visible at the bottom, visually separated from the nav by its
              own card surface + the margin below. */}
          <div className="glass" style={{ padding: '16px 18px', borderRadius: '16px', background: 'rgba(255,255,255,.02)', marginTop: '16px', flexShrink: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
            <div className="en" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', letterSpacing: '.5px' }}>{role?.name || 'Administrator'}</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <Link to="/" className="btn btn-outline" style={{ flex: 1, fontSize: '11.5px', padding: '8px 12px', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>{t('topbar.viewSite')}</Link>
              <button onClick={logout} className="btn btn-outline" style={{ flex: 1, fontSize: '11.5px', padding: '8px 12px', justifyContent: 'center', borderColor: 'rgba(239,68,68,.4)', color: '#f87171' }}>{t('logout')}</button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA — `marginInlineStart` reserves space for the
            sidebar on whichever side it actually sits on for the current
            direction (physical `marginRight` never released that space
            under dir="ltr", which is why content visually drifted left
            while a right-sized gap it no longer needed stayed reserved on
            the right, and the sidebar itself stayed pinned there too). */}
        <div className="admin-main" style={{ marginInlineStart: '320px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px 12px 40px 32px' }}>
          {/* TOP BAR */}
          <header className="glass" style={{
            height: '76px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            borderRadius: '20px',
            marginBottom: '32px',
            position: 'sticky',
            top: '20px',
            zIndex: 40,
          }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                {pageTitle}
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', opacity: 0.8 }}>
                {pageGroup}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* SEARCH */}
              <div ref={searchWrapRef} style={{ position: 'relative' }}>
                <div className="admin-search">
                  <Search size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder={t('topbar.searchPlaceholder')}
                    aria-label={t('topbar.searchPlaceholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchResults.length > 0) {
                        goToResult(searchResults[0].href);
                      } else if (e.key === 'Escape') {
                        setSearchFocused(false);
                      }
                    }}
                  />
                </div>
                {searchFocused && searchQuery.trim() && (
                  <div className="admin-dropdown" style={{ insetInlineEnd: 0, width: '280px' }}>
                    {searchResults.length === 0 ? (
                      <div className="admin-dropdown-empty">{t('topbar.searchNoResults')}</div>
                    ) : (
                      searchResults.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.href} className="admin-dropdown-item" onClick={() => goToResult(item.href)}>
                            <Icon size={15} />
                            <span style={{ fontSize: '13.5px' }}>{item.label}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* NOTIFICATIONS */}
              <div ref={notifWrapRef} style={{ position: 'relative' }}>
                <button type="button" className="admin-icon-btn" onClick={openNotifications} aria-label={t('topbar.notifications')}>
                  <Bell size={17} />
                  {unreadCount > 0 && <span className="admin-badge-dot" />}
                </button>
                {notifOpen && (
                  <div className="admin-dropdown" style={{ insetInlineEnd: 0, width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{t('topbar.notifications')}</span>
                      {!!notifications?.some((n) => !n.isRead) && (
                        <button type="button" onClick={handleMarkAllRead} style={{ fontSize: '11.5px', color: 'var(--glow)', fontWeight: 500 }}>
                          {t('topbar.notificationsMarkAllRead')}
                        </button>
                      )}
                    </div>
                    {notifLoading ? (
                      <div className="admin-dropdown-empty">{t('topbar.notificationsLoading')}</div>
                    ) : !notifications || notifications.length === 0 ? (
                      <div className="admin-dropdown-empty">{t('topbar.notificationsEmpty')}</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`admin-dropdown-item${!n.isRead ? ' is-unread' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                            {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{n.title}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{n.body}</div>
                          <div className="en" style={{ fontSize: '10.5px', color: 'var(--muted)', opacity: 0.7 }}>{formatRelativeTime(n.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <LanguageSwitcher />
              <div className="admin-cms-badge" style={{ fontSize: '12px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(216,180,254,0.25)', padding: '6px 16px', borderRadius: '100px', color: 'var(--glow)', fontWeight: 500 }}>
                {t('topbar.cmsVersion')}
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', color: '#fff', boxShadow: '0 0 20px rgba(168,85,247,0.45)' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main key={pathname} className="dash-fade-up" style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
