import React from 'react';
import { useTranslation } from 'react-i18next';

export const WhyChoose: React.FC = () => {
  const { t } = useTranslation('home');

  const keys = ['speed', 'design', 'support', 'ai', 'pricing'];

  return (
    <section id="why">
      <div className="wrap">
        <span className="eyebrow en">{t('why.eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('why.titlePrefix')} <b>{t('why.titleHighlight')}</b> {t('why.titleSuffix')}
        </h2>
        <p className="section-sub reveal-up">{t('why.sub')}</p>
        <div className="compare glass reveal-up" id="compareTable">
          <div className="compare-row head">
            <div className="compare-cell label en">CRITERIA</div>
            <div className="compare-cell center en">{t('why.traditional')}</div>
            <div className="compare-cell center yf en">YF</div>
          </div>
          {keys.map((k, i) => {
            const row = t(`why.rows.${k}`, { returnObjects: true }) as string[];
            return (
              <div key={i} className="compare-row">
                <div className="compare-cell label">{row[0]}</div>
                <div className="compare-cell center" style={{ color: 'var(--muted)', fontSize: '13.5px' }}>{row[1]}</div>
                <div className="compare-cell center" style={{ color: '#e8e3ee', fontSize: '13.5px' }}>{row[2]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
