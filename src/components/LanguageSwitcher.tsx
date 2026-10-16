import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('yf_lang', nextLang);
    document.documentElement.setAttribute('dir', nextLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-outline magnetic"
      style={{ padding: '8px 16px', fontSize: '13px', minWidth: '46px' }}
      title="Switch Language / تغيير اللغة"
      aria-label="Switch language"
    >
      <span className="en" style={{ fontWeight: 600 }}>
        {i18n.language === 'ar' ? 'EN' : 'AR'}
      </span>
    </button>
  );
};
