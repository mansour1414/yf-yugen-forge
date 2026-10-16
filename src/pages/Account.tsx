import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClientPortalGuard } from '../components/ClientPortalGuard';
import { ClientOverview } from './ClientOverview';
import { SEO } from '../components/SEO';

export const Account: React.FC = () => {
  const { t } = useTranslation('portal');
  return (
    <ClientPortalGuard>
      <SEO title={t('nav.overview')} robots="noindex, nofollow" />
      <ClientOverview />
    </ClientPortalGuard>
  );
};

export default Account;
