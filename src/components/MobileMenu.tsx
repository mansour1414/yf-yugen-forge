import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  return (
    <div id="mobile-menu" className={isOpen ? 'open' : ''}>
      <a href="#hero" onClick={onClose}>{t('nav.home')}</a>
      <a href="#services" onClick={onClose}>{t('nav.services')}</a>
      <a href="#portfolio" onClick={onClose}>{t('nav.portfolio')}</a>
      <a href="#process" onClick={onClose}>{t('nav.process')}</a>
      <a href="#pricing" onClick={onClose}>{t('nav.pricing')}</a>
      <a href="#contact" onClick={onClose}>{t('nav.contact')}</a>
      <div style={{ marginTop: '20px' }}>
        <LanguageSwitcher />
      </div>
    </div>
  );
};
