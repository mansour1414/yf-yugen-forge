import React from 'react';
import { ICONS } from '../utils/icons';
import { useTranslation } from 'react-i18next';

const stageIcons = ['discover', 'plan', 'build', 'launch', 'scale'];

export const Process: React.FC = () => {
  const { t } = useTranslation('home');
  const stages = (t('process.stages', { returnObjects: true }) as Array<{ title: string; desc: string }>) || [];

  return (
    <section id="process">
      <div className="wrap">
        <span className="eyebrow en">{t('process.eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('process.titlePrefix')} <b>{t('process.titleHighlight')}</b>
        </h2>
        <p className="section-sub reveal-up">{t('process.sub')}</p>
        <div className="timeline">
          <div className="timeline-track">
            <div className="timeline-track-fill" id="timelineFill"></div>
          </div>
          <div className="timeline-items" id="timelineItems">
            {stages.map((s, i) => (
              <div key={i} className="t-item">
                <div className="t-dot" data-active>{ICONS[stageIcons[i]] || ICONS.code}</div>
                <span className="t-num en">{String(i + 1).padStart(2, '0')}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
