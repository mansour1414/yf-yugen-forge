import React, { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Loading } from './Loading';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ForcePasswordChangeGate } from './ForcePasswordChangeGate';

interface ClientPortalGuardProps {
  children: ReactNode;
}

export const ClientPortalGuard: React.FC<ClientPortalGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, role, logout } = useAuth();
  const { t } = useTranslation('portal');
  const { t: tAdmin } = useTranslation('admin');

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    window.location.href = '/admin/login';
    return <Loading />;
  }

  // Defense in depth: a staff account should never see the client portal,
  // even if they type an /account URL directly (mirrors the equivalent
  // Client-role check in ProtectedRoute.tsx for the admin side).
  if (role && role.name !== 'Client') {
    window.location.href = '/admin/dashboard';
    return <Loading />;
  }

  if (user?.mustChangePassword) {
    return <ForcePasswordChangeGate />;
  }

  const navItems = [
    { href: '/account', label: t('nav.overview') },
    { href: '/account/contracts', label: t('nav.contracts') },
    { href: '/account/contact', label: t('nav.contact') },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px', margin: '0 auto', paddingTop: '30px', paddingBottom: '60px' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
          <Link to="/"><img src="/logo.svg" alt="YF Studio" style={{ height: '38px' }} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <LanguageSwitcher />
            <button onClick={logout} className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px', borderColor: 'rgba(239,68,68,.4)', color: '#f87171' }}>
              {tAdmin('logout')}
            </button>
          </div>
        </div>

        <div className="glass no-print" style={{ padding: '16px 20px', marginBottom: '24px', borderRadius: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{user?.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '2px' }}>{user?.email}</div>
        </div>

        <nav className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/account'}
              style={({ isActive }) => ({
                padding: '10px 20px',
                borderRadius: '100px',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'linear-gradient(135deg, rgba(168,85,247,0.22), rgba(124,58,237,0.08))' : 'rgba(255,255,255,.03)',
                border: isActive ? '1px solid rgba(216,180,254,0.35)' : '1px solid var(--line)',
                textDecoration: 'none',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default ClientPortalGuard;
