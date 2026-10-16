import React, { useEffect, useState } from 'react';
import { ICONS } from '../utils/icons';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Alert } from './admin/Alert';

export const Contact: React.FC = () => {
  const { t, i18n } = useTranslation('contact');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('whatsapp');

  useEffect(() => {
    api.get('/api/public/settings')
      .then((res) => {
        const items = res.data?.data || [];
        const map: Record<string, any> = {};
        items.forEach((s: any) => {
          map[s.key] = s.parsedValue !== undefined ? s.parsedValue : s.value;
        });
        setSettings(map);
      })
      .catch(() => {});
  }, []);

  const contactEmail = settings.contact_email || 'Hello.youssefalfaraj@gmail.com';
  // Single source of truth for WhatsApp: whatever is configured in CMS settings drives
  // both the visible number and the wa.me link. wa.me requires digits only (no +, spaces,
  // or dashes), so we derive a sanitized version for the link while keeping the
  // CMS-formatted value for display.
  const whatsappNumberRaw: string = settings.whatsapp_number || '+966563199878';
  const whatsappDigits = whatsappNumberRaw.replace(/\D/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameEl = document.getElementById('clientName') as HTMLInputElement;
    const emailEl = document.getElementById('clientEmail') as HTMLInputElement;
    const typeEl = document.getElementById('clientProjectType') as HTMLSelectElement;
    const budgetEl = document.getElementById('clientBudget') as HTMLInputElement;
    const msgEl = document.getElementById('clientMessage') as HTMLTextAreaElement;

    if (!nameEl || !emailEl || !typeEl || !budgetEl || !msgEl) return;

    setSubmitting(true);
    setError(null);

    const budgetValue = budgetEl.value.trim();

    try {
      // Save message to backend regardless of chosen method. When "Email" is
      // chosen, the backend also sends a copy to the configured contact
      // email (see email.service.ts) — this still works even if SMTP isn't
      // configured, it just skips sending and logs a warning.
      await api.post('/api/messages', {
        name: nameEl.value,
        email: emailEl.value,
        subject: typeEl.value,
        budget: budgetValue || undefined,
        message: msgEl.value,
        source: contactMethod === 'whatsapp' ? 'Website Contact Form (WhatsApp)' : 'Website Contact Form (Email)',
        contactMethod,
        lang: i18n.language === 'ar' ? 'ar' : 'en',
      });

      if (contactMethod === 'whatsapp') {
        const budgetText = budgetValue || (i18n.language === 'ar' ? 'غير محدد' : 'Not specified');
        const prefix = i18n.language === 'ar' ? 'السلام عليكم يوسف،\n\nأرغب في بدء مشروع جديد مع YF Digital Studio:' : 'Hello Youssef,\n\nI would like to start a new project with YF Digital Studio:';
        const text = `${prefix}\n\n👤 *Name:* ${nameEl.value}\n📧 *Email:* ${emailEl.value}\n📌 *Project Type:* ${typeEl.value}\n💰 *Budget:* ${budgetText}\n💬 *Details:* ${msgEl.value}`;
        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/${whatsappDigits}?text=${encoded}`, '_blank');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact">
      <div className="wrap">
        <span className="eyebrow en">{t('eyebrow')}</span>
        <h2 className="section-title reveal-up">
          {t('titlePrefix')} <b>{t('titleHighlight')}</b>
        </h2>
        <p className="section-sub reveal-up">{t('sub')}</p>
        
        {error && <Alert tone="error">{error}</Alert>}

        <div className="contact-grid">
          <form className="contact-form glass reveal-up" onSubmit={handleSubmit}>
            <div id="formFields" style={{ display: success ? 'none' : 'block' }}>
              <div className="form-row">
                <div className="field">
                  <label>{t('form.fullName')}</label>
                  <input type="text" id="clientName" required placeholder={t('form.namePlaceholder')} />
                </div>
                <div className="field">
                  <label>{t('form.email')}</label>
                  <input type="email" id="clientEmail" required placeholder="you@email.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{t('form.projectType')}</label>
                  <select id="clientProjectType">
                    <option>{t('form.types.website')}</option>
                    <option>{t('form.types.webapp')}</option>
                    <option>{t('form.types.ai')}</option>
                    <option>{t('form.types.branding')}</option>
                    <option>{t('form.types.other')}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('form.budget')}</label>
                  <input type="number" id="clientBudget" min="0" inputMode="numeric" placeholder={t('form.budgetPlaceholder')} />
                </div>
              </div>
              <div className="field">
                <label>{t('form.details')}</label>
                <textarea id="clientMessage" required placeholder={t('form.messagePlaceholder')} ></textarea>
              </div>
              <div className="field">
                <label>{t('form.methodLabel')}</label>
                <div className="filters" style={{ marginTop: 0, marginBottom: 0 }}>
                  <button
                    type="button"
                    className={`filter-btn ${contactMethod === 'whatsapp' ? 'active' : ''}`}
                    onClick={() => setContactMethod('whatsapp')}
                    aria-pressed={contactMethod === 'whatsapp'}
                  >
                    {t('form.methodWhatsapp')}
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${contactMethod === 'email' ? 'active' : ''}`}
                    onClick={() => setContactMethod('email')}
                    aria-pressed={contactMethod === 'email'}
                  >
                    {t('form.methodEmail')}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary magnetic" disabled={submitting}>
                {submitting ? t('form.sending') : (contactMethod === 'whatsapp' ? t('form.submit') : t('form.submitEmail'))}
              </button>
            </div>
            <div className={`form-success ${success ? 'show' : ''}`} id="formSuccess">
              {ICONS.check}
              <h3>{contactMethod === 'whatsapp' ? t('form.successTitle') : t('form.successTitleEmail')}</h3>
              <p style={{ color: 'var(--muted)', marginTop: '10px' }}>{contactMethod === 'whatsapp' ? t('form.successSub') : t('form.successSubEmail')}</p>
            </div>
          </form>
          <div className="contact-side glass reveal-up">
            <div className="glow-orb"></div>
            <div>
              <div className="contact-info-item">
                <div className="lbl en">{t('info.emailLabel')}</div>
                <div className="val en">{contactEmail}</div>
              </div>
              <div className="contact-info-item">
                <div className="lbl en">{t('info.whatsappLabel')}</div>
                <div className="val en" dir="ltr">{whatsappNumberRaw}</div>
              </div>
              <div className="contact-info-item">
                <div className="lbl">{t('info.license')}</div>
                <div className="val font-mono">{t('info.licenseValue')}</div>
              </div>
            </div>
            <div className="socials" id="socials">
              {settings.social_x_enabled && settings.social_x_url && (
                <a href={settings.social_x_url} target="_blank" rel="noopener noreferrer">{ICONS.x_social}</a>
              )}
              {settings.social_linkedin_enabled && settings.social_linkedin_url && (
                <a href={settings.social_linkedin_url} target="_blank" rel="noopener noreferrer">{ICONS.in_social}</a>
              )}
              {settings.social_instagram_enabled && settings.social_instagram_url && (
                <a href={settings.social_instagram_url} target="_blank" rel="noopener noreferrer">{ICONS.ig_social}</a>
              )}
              {settings.social_tiktok_enabled && settings.social_tiktok_url && (
                <a href={settings.social_tiktok_url} target="_blank" rel="noopener noreferrer">{ICONS.tiktok_social}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
