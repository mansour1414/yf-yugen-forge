import React, { useEffect, useState } from 'react';
import { ICONS } from '../utils/icons';
import { useTranslation } from 'react-i18next';
import { useHomeData } from '../context/HomeDataContext';

export const Portfolio: React.FC = () => {
  const { t } = useTranslation('portfolio');
  const { t: tCommon } = useTranslation('common');
  const allLabel = t('all');
  const { data, loading, error } = useHomeData();
  const projects = data?.featuredProjects ?? [];
  const [activeCategory, setActiveCategory] = useState(allLabel);

  useEffect(() => {
    setActiveCategory(t('all'));
  }, [t]);

  const cats = [allLabel, ...Array.from(new Set(projects.map((p) => p.category)))];

  return (
    <section id="portfolio">
      <div className="wrap">
        <span className="eyebrow en">{t('eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('titlePrefix')} <b>{t('titleHighlight')}</b>
        </h2>
        <p className="section-sub reveal-up">{t('sub')}</p>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{tCommon('status.loadingPortfolio')}</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#f87171' }}>{tCommon('status.errorPortfolio')}</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{tCommon('status.emptyPortfolio')}</div>
        ) : (
          <>
            <div className="filters reveal-up">
              {cats.map((c, i) => (
                <button
                  key={i}
                  className={`filter-btn ${activeCategory === c ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c)}
                  aria-label={`Filter by ${c}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="portfolio-grid" id="portfolioGrid">
              {projects.map((p, i) => (
                <div
                  key={p.id || i}
                  className={`p-card reveal-up ${activeCategory !== allLabel && p.category !== activeCategory ? 'hide' : ''}`}
                  data-cat={p.category}
                >
                  <div className="p-mock" style={{ position: 'absolute', inset: 0 }}>
                    <img src={p.thumbnail || p.coverImage} alt={p.title} loading="lazy" width="600" height="340" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9)' }} />
                  </div>
                  <div className="p-view">{ICONS.arrow}</div>
                  <div className="p-badge en">{p.type}</div>
                  <div className="p-overlay">
                    <div className="p-cat en">{p.type} · {p.category}</div>
                    <div className="p-title">{p.title}</div>
                    <div className="p-desc">{p.shortDescription}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
