import React from 'react';
import { ICONS } from '../utils/icons';
import { useTranslation } from 'react-i18next';
import { useHomeData } from '../context/HomeDataContext';

export const Pricing: React.FC = () => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const { data, loading, error } = useHomeData();
  const plans = data?.pricingPlans ?? [];
  const currencyLabel = t('pricing.sar');
  const customLabel = t('pricing.custom');

  return (
    <section id="pricing">
      <div className="wrap">
        <span className="eyebrow en">{t('pricing.eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('pricing.titlePrefix')} <b>{t('pricing.titleHighlight')}</b>
        </h2>
        <p className="section-sub reveal-up">{t('pricing.sub')}</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{tCommon('status.loadingPricing')}</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#f87171' }}>{tCommon('status.errorPricing')}</div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{tCommon('status.emptyPricing')}</div>
        ) : (
          <div className="pricing-grid" id="pricingGrid">
            {plans.map((p, i) => (
              <div key={p.id || i} className={`price-card glass reveal-up ${p.featured ? 'featured' : ''}`}>
                {p.featured && <div className="price-badge en">{t('pricing.popular')}</div>}
                <div className="price-tier">{p.tier}</div>
                <div className="price-amount en">
                  {p.isCustom ? customLabel : <>{p.price} <span>{currencyLabel}</span></>}
                </div>
                <div className="price-desc">{p.desc}</div>
                <ul className="price-feats">
                  {p.feats.map((f, idx) => (
                    <li key={idx}>
                      {ICONS.check}
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} magnetic`}>
                  {t('pricing.cta')}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Pricing;
