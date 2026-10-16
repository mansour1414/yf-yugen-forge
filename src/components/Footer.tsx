import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const { t: tPrivacy } = useTranslation('privacy');
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    api.get('/api/public/settings')
      .then((res) => {
        const items = res.data?.data || [];
        const map: Record<string, any> = {};
        items.forEach((s: any) => {
          map[s.key] = s.parsedValue !== undefined ? s.parsedValue : s.value;
        });
        setSettings(map);
      })
      .catch(() => {});
  }, []);

  const locationLabel = settings.location || (i18n.language === 'ar' ? 'الدمام، السعودية' : 'Dammam, Saudi Arabia');
  const contactEmail = settings.contact_email || 'Hello.youssefalfaraj@gmail.com';
  const tagline = settings.footer_tagline || t('footer.tagline');

  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div>
            <a href="#hero" className="logo">
              <img src="/logo.svg" alt="YF Digital Studio" className="logo-img" />
            </a>
            <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '16px', maxWidth: '280px', lineHeight: '1.9' }}>
              {tagline}
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h5>{t('footer.company')}</h5>
              <a href="#hero">{t('nav.home')}</a>
              <a href="#portfolio">{t('nav.portfolio')}</a>
              <a href="#pricing">{t('nav.pricing')}</a>
            </div>
            <div className="footer-col">
              <h5>{t('footer.services')}</h5>
              <a href="#services">{t('nav.services')}</a>
              <a href="#services">AI Solutions</a>
              <a href="#services">UI/UX Design</a>
            </div>
            <div className="footer-col">
              <h5>{t('footer.contact')}</h5>
              <a href="#contact" className="en">{contactEmail}</a>
              <a href="#contact">{locationLabel}</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('footer.rights')}</span>
          <Link to="/privacy-policy" style={{ color: 'var(--muted)' }}>{tPrivacy('title')}</Link>
          <span className="en">{t('footer.crafted')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
