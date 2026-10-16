import React, { useEffect } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { useHomeData } from '../context/HomeDataContext';

export const Hero: React.FC = () => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const { data, loading, error } = useHomeData();
  const heroData = data?.hero ?? null;

  useEffect(() => {
    const heroMockup = document.getElementById('heroMockup');
    const mockupFrame = document.getElementById('mockupFrame');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduced && window.innerWidth > 900 && heroMockup && mockupFrame) {
      const handleMouseMove = (e: MouseEvent) => {
        const r = heroMockup.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(mockupFrame, { rotateX: 6 - py * 8, rotateY: px * 8, duration: 0.6, ease: 'power2.out' });
      };
      const handleMouseLeave = () => {
        gsap.to(mockupFrame, { rotateX: 6, rotateY: 0, duration: 0.8, ease: 'power3.out' });
      };

      heroMockup.addEventListener('mousemove', handleMouseMove);
      heroMockup.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        heroMockup.removeEventListener('mousemove', handleMouseMove);
        heroMockup.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [heroData]);

  const title = heroData?.title || t('hero.title');
  const lead = heroData?.subtitle || t('hero.lead');
  const buttonText = heroData?.buttonText || tCommon('nav.startProject');
  const buttonLink = heroData?.buttonLink || '#contact';

  return (
    <section id="hero" data-cms-loading={loading || undefined} data-cms-error={error ? 'true' : undefined}>
      <div className="wrap hero-inner">
        <div className="reveal-up"><span className="eyebrow en">{t('hero.eyebrow')}</span></div>
        <h1 className="reveal-up">{title}</h1>
        <p className="lead reveal-up">{lead}</p>
        <div className="hero-cta reveal-up">
          <a href={buttonLink} className="btn btn-primary magnetic">{buttonText}</a>
          <a href="#portfolio" className="btn btn-outline magnetic">{tCommon('nav.exploreWork')}</a>
        </div>
        <div className="hero-stats reveal-up">
          <div><div className="num en">120+</div><div className="lbl">{t('hero.stats.projects')}</div></div>
          <div><div className="num en">45+</div><div className="lbl">{t('hero.stats.clients')}</div></div>
          <div><div className="num en">8+</div><div className="lbl">{t('hero.stats.experience')}</div></div>
          <div><div className="num en">99%</div><div className="lbl">{t('hero.stats.satisfaction')}</div></div>
        </div>
        <div className="hero-mockup reveal-up" id="heroMockup">
          <div className="mockup-frame" id="mockupFrame">
            <div className="mockup-bar">
              <div className="mockup-dots"><span></span><span></span><span></span></div>
              <div className="mockup-url en">app.yf.studio/dashboard</div>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="ms-item active"></div>
                <div className="ms-item"></div>
                <div className="ms-item"></div>
                <div className="ms-item"></div>
              </div>
              <div className="mockup-main">
                <div className="mockup-stats">
                  <div className="ms-card"><span className="ms-lbl">{t('hero.mockup.revenue')}</span><span className="ms-val en">$482K</span><span className="ms-delta en">+24%</span></div>
                  <div className="ms-card"><span className="ms-lbl">{t('hero.mockup.users')}</span><span className="ms-val en">12.4K</span><span className="ms-delta en">+8%</span></div>
                  <div className="ms-card"><span className="ms-lbl">{t('hero.mockup.conversion')}</span><span className="ms-val en">6.8%</span><span className="ms-delta en">+2.1%</span></div>
                </div>
                <div className="mockup-chart">
                  <svg viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7C3AED"/><stop offset="100%" stop-color="#C084FC"/></linearGradient></defs>
                    <polyline points="0,90 40,72 80,80 120,52 160,60 200,32 240,44 280,20 320,34 360,12 400,24" fill="none" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
