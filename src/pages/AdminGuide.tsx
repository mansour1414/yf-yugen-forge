import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/admin/PageHeader';

const TOPICS: Array<{ key: string; icon: string; href: string }> = [
  { key: 'pricing', icon: '💰', href: '/admin/pricing' },
  { key: 'services', icon: '⚡', href: '/admin/services' },
  { key: 'projects', icon: '💼', href: '/admin/projects' },
  { key: 'hero', icon: '🚀', href: '/admin/hero' },
  { key: 'media', icon: '🖼️', href: '/admin/media' },
  { key: 'testimonials', icon: '⭐', href: '/admin/testimonials' },
  { key: 'messages', icon: '✉️', href: '/admin/messages' },
  { key: 'clients', icon: '🤝', href: '/admin/clients' },
  { key: 'contracts', icon: '📄', href: '/admin/contracts' },
];

export const AdminGuide: React.FC = () => {
  const { t } = useTranslation('admin');

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader title={t('guide.pageTitle')} subtitle={t('guide.pageSubtitle')} />

      <div style={{ display: 'grid', gap: '18px' }}>
        {TOPICS.map((topic) => (
          <div key={topic.key} className="glass dash-card" style={{ padding: '26px 28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{topic.icon}</span> {t(`guide.topics.${topic.key}.title`)}
              </h3>
              <a href={topic.href} className="btn btn-outline" style={{ fontSize: '12.5px', padding: '8px 16px', whiteSpace: 'nowrap' }}>
                {t('guide.goToPage')}
              </a>
            </div>
            <ol style={{ display: 'grid', gap: '8px', paddingInlineStart: '22px', color: '#e8e3ee', fontSize: '13.5px', lineHeight: 1.9 }}>
              {(t(`guide.topics.${topic.key}.steps`, { returnObjects: true }) as string[]).map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGuide;
