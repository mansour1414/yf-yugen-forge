import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { t } = useTranslation('common');
  const { t: tAdmin } = useTranslation('admin');
  const { isAuthenticated, role } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header id="siteHeader" className={scrolled ? 'scrolled' : ''}>
      <nav className="wrap">
        <a href="#hero" className="logo">
          <img src="/logo.svg" alt="YF Digital Studio" className="logo-img" />
        </a>
        <ul className="nav-links">
          <li><a href="#hero">{t('nav.home')}</a></li>
          <li><a href="#services">{t('nav.services')}</a></li>
          <li><a href="#portfolio">{t('nav.portfolio')}</a></li>
          <li><a href="#process">{t('nav.process')}</a></li>
          <li><a href="#pricing">{t('nav.pricing')}</a></li>
          <li><a href="#contact">{t('nav.contact')}</a></li>
        </ul>
        <div className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSwitcher />
          <a href="#contact" className="btn btn-outline magnetic">{t('nav.startProject')}</a>
          {isAuthenticated ? (
            <Link to={role?.name === 'Client' ? '/account' : '/admin/dashboard'} className="btn btn-outline magnetic" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              {role?.name === 'Client' ? tAdmin('myAccount', { defaultValue: 'My Account' }) : t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/admin/login" className="btn btn-outline magnetic">{t('nav.login')}</Link>
          )}
          <div
            className={`burger ${isMobileMenuOpen ? 'open' : ''}`}
            id="burger"
            onClick={onToggleMobileMenu}
            role="button"
            tabIndex={0}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>
    </header>
  );
};
