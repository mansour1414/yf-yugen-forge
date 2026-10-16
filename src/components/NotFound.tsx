import React from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from './SEO';

export const NotFound: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '0 20px',
      position: 'relative',
      zIndex: 2
    }}>
      {/* The host answers unknown URLs with the SPA shell (HTTP 200), so keep them out of search indexes. */}
      <SEO title={t('notfound.titlePrefix')} robots="noindex, nofollow" />
      <span className="eyebrow en">{t('notfound.eyebrow')}</span>
      <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 600, marginTop: '16px' }}>
        {t('notfound.titlePrefix')}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '16px', marginTop: '16px', maxWidth: '500px', lineHeight: '1.8' }}>
        {t('notfound.sub')}
      </p>
      <a href="/" className="btn btn-primary magnetic" style={{ marginTop: '34px' }}>
        {t('notfound.homeBtn')}
      </a>
    </div>
  );
};

export default NotFound;
