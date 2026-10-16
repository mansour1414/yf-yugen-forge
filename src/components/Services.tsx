import React from 'react';
import { ICONS } from '../utils/icons';
import { useTranslation } from 'react-i18next';
import { useHomeData } from '../context/HomeDataContext';

export const Services: React.FC = () => {
  const { t } = useTranslation('services');
  const { t: tCommon } = useTranslation('common');
  const { data, loading, error } = useHomeData();
  const services = data?.services ?? [];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  };

  return (
    <section id="services">
      <div className="wrap">
        <span className="eyebrow en">{t('eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('titlePrefix')} <b>{t('titleHighlight')}</b>
        </h2>
        <p className="section-sub reveal-up">{t('sub')}</p>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{tCommon('status.loadingServices')}</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#f87171' }}>{tCommon('status.errorServices')}</div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{tCommon('status.emptyServices')}</div>
        ) : (
          <div className="services-grid" id="servicesGrid">
            {services.map((s, i) => (
              <div
                key={s.id || i}
                className="service-card reveal-up"
                onMouseMove={handleMouseMove}
              >
                <div>
                  <span className="num en">{String(i + 1).padStart(2, '0')}</span>
                  <div className="service-icon">{ICONS[s.icon] || ICONS.code}</div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
                <div className="arrow">{ICONS.arrow}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
