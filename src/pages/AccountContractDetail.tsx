import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClientPortalGuard } from '../components/ClientPortalGuard';
import { ClientContractDetail } from './ClientContractDetail';
import { SEO } from '../components/SEO';

export const AccountContractDetail: React.FC = () => {
  const { t } = useTranslation('portal');
  return (
    <ClientPortalGuard>
      <SEO title={t('nav.contracts')} robots="noindex, nofollow" />
      <ClientContractDetail />
    </ClientPortalGuard>
  );
};

export default AccountContractDetail;
