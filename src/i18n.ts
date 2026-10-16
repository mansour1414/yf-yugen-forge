import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enServices from './locales/en/services.json';
import enPortfolio from './locales/en/portfolio.json';
import enContact from './locales/en/contact.json';
import enAdmin from './locales/en/admin.json';
import enPrivacy from './locales/en/privacy.json';
import enPortal from './locales/en/portal.json';

import arCommon from './locales/ar/common.json';
import arHome from './locales/ar/home.json';
import arServices from './locales/ar/services.json';
import arPortfolio from './locales/ar/portfolio.json';
import arContact from './locales/ar/contact.json';
import arAdmin from './locales/ar/admin.json';
import arPrivacy from './locales/ar/privacy.json';
import arPortal from './locales/ar/portal.json';

const savedLang = localStorage.getItem('yf_lang') || 'ar';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      home: enHome,
      services: enServices,
      portfolio: enPortfolio,
      contact: enContact,
      admin: enAdmin,
      privacy: enPrivacy,
      portal: enPortal,
    },
    ar: {
      common: arCommon,
      home: arHome,
      services: arServices,
      portfolio: arPortfolio,
      contact: arContact,
      admin: arAdmin,
      privacy: arPrivacy,
      portal: arPortal,
    },
  },
  lng: savedLang,
  fallbackLng: 'en',
  ns: ['common', 'home', 'services', 'portfolio', 'contact', 'admin', 'privacy', 'portal'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
