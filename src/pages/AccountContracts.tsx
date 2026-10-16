import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClientPortalGuard } from '../components/ClientPortalGuard';
import { ClientContracts } from './ClientContracts';
import { SEO } from '../components/SEO';

export const AccountContracts: React.FC = () => {
  const { t } = useTranslation('portal');
  return (
    <ClientPortalGuard>
      <SEO title={t('nav.contracts')} robots="noindex, nofollow" />
      <ClientContracts />
    </ClientPortalGuard>
  );
};

export default AccountContracts;
