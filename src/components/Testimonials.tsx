import React from 'react';
import { ICONS } from '../utils/icons';
import { useTranslation } from 'react-i18next';
import { useHomeData } from '../context/HomeDataContext';
import { TestimonialItem } from '../types/home';

export const Testimonials: React.FC = () => {
  const { t, i18n } = useTranslation('home');
  const { data, loading, error } = useHomeData();
  const testimonials = data?.testimonials ?? [];

  const fallbackTestimonialsAr: TestimonialItem[] = [
    { id: '1', name: 'سارة العتيبي', company: 'Lumen', position: 'مديرة تسويق', rating: 5, content: 'فريق YF غيّر شكل حضورنا الرقمي بالكامل. النتائج فاقت التوقعات في أقل من شهرين.' },
    { id: '2', name: 'خالد المطيري', company: 'Orbit', position: 'مؤسس', rating: 5, content: 'احترافية عالية وسرعة تنفيذ لافتة. التصميم يعكس بالضبط الهوية التي كنا نتخيلها.' },
  ];
  const fallbackTestimonialsEn: TestimonialItem[] = [
    { id: '1', name: 'Sarah Al-Otaibi', company: 'Lumen', position: 'Marketing Manager', rating: 5, content: 'The YF team completely transformed our digital presence. Results exceeded expectations in under two months.' },
    { id: '2', name: 'Khalid Al-Mutairi', company: 'Orbit', position: 'Founder', rating: 5, content: 'High professionalism and remarkable execution speed. The design reflects exactly the identity we envisioned.' },
  ];
  const displayList = testimonials.length > 0
    ? testimonials
    : (i18n.language === 'ar' ? fallbackTestimonialsAr : fallbackTestimonialsEn);

  return (
    <section id="testimonials" data-cms-loading={loading || undefined} data-cms-error={error ? 'true' : undefined}>
      <div className="wrap">
        <span className="eyebrow en">{t('testimonials.eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('testimonials.titlePrefix')} <b>{t('testimonials.titleHighlight')}</b>
        </h2>
        <p className="section-sub reveal-up">{t('testimonials.sub')}</p>
      </div>
      <div className="marquee-wrap reveal-up">
        <div className="marquee-track" id="marqueeTrack">
          {[...displayList, ...displayList].map((item, i) => (
            <div key={item.id ? `${item.id}-${i}` : i} className="t-card glass">
              <div className="t-stars">
                {Array.from({ length: item.rating || 5 }).map((_, idx) => (
                  <span key={idx}>{ICONS.star}</span>
                ))}
              </div>
              <p>"{item.content}"</p>
              <div className="t-person">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="t-avatar en">{item.name.charAt(0)}</div>
                )}
                <div>
                  <div className="t-name">{item.name}</div>
                  <div className="t-role">{item.company}{item.position ? ` • ${item.position}` : ''}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
