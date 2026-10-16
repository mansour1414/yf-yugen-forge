import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SEO } from '../components/SEO';

interface PrivacySection {
  heading: string;
  body: string;
}

export const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation('privacy');
  const { t: tCommon } = useTranslation('common');
  const sections = (t('sections', { returnObjects: true }) as PrivacySection[]) || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <SEO title={t('title')} description={t('subtitle')} path="/privacy-policy" />
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px', margin: '0 auto', paddingTop: '50px', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <Link to="/"><img src="/logo.svg" alt="YF Studio" style={{ height: '40px' }} /></Link>
          <LanguageSwitcher />
        </div>

        <span className="eyebrow en">{t('eyebrow')}</span>
        <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 44px)', fontWeight: 600, marginTop: '10px' }}>{t('title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px', marginTop: '12px', lineHeight: '1.8' }}>{t('subtitle')}</p>

        <div className="glass" style={{ padding: '20px 24px', marginTop: '30px', borderRadius: '14px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: '1.8', margin: 0 }}>{t('disclaimer')}</p>
        </div>

        <div className="glass" style={{ padding: '36px', marginTop: '24px', borderRadius: '20px' }}>
          <p style={{ color: '#e8e3ee', fontSize: '15px', lineHeight: '1.9' }}>{t('intro')}</p>

          {sections.map((section, index) => (
            <div key={index} style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 600, marginBottom: '12px' }}>{section.heading}</h2>
              {section.body.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex} style={{ color: '#e8e3ee', fontSize: '14.5px', lineHeight: '1.9', marginTop: pIndex > 0 ? '14px' : 0 }}>
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <Link to="/" className="btn btn-outline magnetic">
            {tCommon('notfound.homeBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
