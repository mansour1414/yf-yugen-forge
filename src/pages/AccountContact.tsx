import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClientPortalGuard } from '../components/ClientPortalGuard';
import { ClientContact } from './ClientContact';
import { SEO } from '../components/SEO';

export const AccountContact: React.FC = () => {
  const { t } = useTranslation('portal');
  return (
    <ClientPortalGuard>
      <SEO title={t('nav.contact')} robots="noindex, nofollow" />
      <ClientContact />
    </ClientPortalGuard>
  );
};

export default AccountContact;
