import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaLibraryItem, MediaLibraryModal } from '../components/MediaLibraryModal';
import { api } from '../lib/api';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface HeroForm {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  buttonTextAr: string;
  buttonTextEn: string;
  buttonLink: string;
  background: string;
  videoUrl: string;
  active: boolean;
}

export const AdminHero: React.FC = () => {
  const { t } = useTranslation('admin');
  const [form, setForm] = useState<HeroForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'background' | 'video' | null>(null);

  useEffect(() => {
    api.get('/api/hero').then((res) => {
      const hero = res.data?.data;
      if (!hero) return;
      setForm({
        id: hero.id,
        titleAr: hero.titleAr || hero.title || '',
        titleEn: hero.titleEn || '',
        subtitleAr: hero.subtitleAr || hero.subtitle || '',
        subtitleEn: hero.subtitleEn || '',
        buttonTextAr: hero.buttonTextAr || hero.buttonText || '',
        buttonTextEn: hero.buttonTextEn || '',
        buttonLink: hero.buttonLink || '',
        background: hero.background || '',
        videoUrl: hero.videoUrl || '',
        active: Boolean(hero.active)
      });
    }).catch((requestError: any) => setError(requestError.response?.data?.error || t('heroPage.loadError'))).finally(() => setLoading(false));
  }, [t]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return;
    const { name, value, type } = event.target;
    setForm({ ...form, [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value });
  };

  const selectMedia = (media: MediaLibraryItem) => {
    if (!form) return;
    setForm({ ...form, [pickerTarget === 'video' ? 'videoUrl' : 'background']: media.url });
    setPickerTarget(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const payload = {
        ...form,
        title: form.titleAr || form.titleEn || 'Hero Title',
        subtitle: form.subtitleAr || form.subtitleEn || 'Hero Subtitle',
        buttonText: form.buttonTextAr || form.buttonTextEn || 'Start',
        background: form.background || null,
        videoUrl: form.videoUrl || null
      };
      const res = await api.put(`/api/hero/${form.id}`, payload);
      const hero = res.data?.data;
      if (hero) {
        setForm({
          ...form,
          titleAr: hero.titleAr || hero.title || '',
          titleEn: hero.titleEn || '',
          subtitleAr: hero.subtitleAr || hero.subtitle || '',
          subtitleEn: hero.subtitleEn || '',
          buttonTextAr: hero.buttonTextAr || hero.buttonText || '',
          buttonTextEn: hero.buttonTextEn || '',
          background: hero.background || '',
          videoUrl: hero.videoUrl || ''
        });
      }
      setSuccess(true);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('heroPage.saveError'));
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('heroPage.loadingHero')}</div>;
  if (!form) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '22px' }}>{t('heroPage.unavailableTitle')}</h2>
      <p style={{ color: '#f87171', marginTop: '12px' }}>{error || t('heroPage.unavailableDesc')}</p>
      <a href="/admin/dashboard" className="btn btn-outline" style={{ marginTop: '22px' }}>{t('heroPage.backToDashboardBtn')}</a>
    </div>
  );

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <PageHeader title={t('heroPage.title')} subtitle={t('heroPage.subtitle')} />
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{t('heroPage.saveSuccess')}</Alert>}
      <form onSubmit={save} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', borderRadius: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.titleAr')}</label>
            <input required name="titleAr" value={form.titleAr} onChange={change} placeholder={t('heroPage.titleArPlaceholder')} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.titleEn')}</label>
            <input required name="titleEn" value={form.titleEn} onChange={change} placeholder={t('heroPage.titleEnPlaceholder')} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.subtitleAr')}</label>
            <textarea required name="subtitleAr" rows={4} value={form.subtitleAr} onChange={change} placeholder={t('heroPage.subtitleArPlaceholder')} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.subtitleEn')}</label>
            <textarea required name="subtitleEn" rows={4} value={form.subtitleEn} onChange={change} placeholder={t('heroPage.subtitleEnPlaceholder')} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.buttonTextAr')}</label>
            <input required name="buttonTextAr" value={form.buttonTextAr} onChange={change} placeholder={t('heroPage.buttonTextArPlaceholder')} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.buttonTextEn')}</label>
            <input required name="buttonTextEn" value={form.buttonTextEn} onChange={change} placeholder={t('heroPage.buttonTextEnPlaceholder')} />
          </div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>{t('heroPage.buttonLink')}</label>
          <input required name="buttonLink" value={form.buttonLink} onChange={change} placeholder={t('heroPage.buttonLinkPlaceholder')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.backgroundImage')}</label>
            <input type="url" name="background" value={form.background} onChange={change} placeholder="https://..." />
            <button type="button" className="btn btn-outline" onClick={() => setPickerTarget('background')} style={{ marginTop: '8px', padding: '6px 11px', fontSize: '11px' }}>{t('heroPage.selectImageFromLibrary')}</button>
            {form.background && <img src={form.background} alt={t('heroPage.backgroundImageAlt')} style={{ display: 'block', width: '100%', height: '130px', objectFit: 'cover', marginTop: '12px', borderRadius: '10px' }} />}
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('heroPage.backgroundVideo')}</label>
            <input type="url" name="videoUrl" value={form.videoUrl} onChange={change} placeholder="https://..." />
            <button type="button" className="btn btn-outline" onClick={() => setPickerTarget('video')} style={{ marginTop: '8px', padding: '6px 11px', fontSize: '11px' }}>{t('heroPage.selectVideoFromLibrary')}</button>
            {form.videoUrl && <video src={form.videoUrl} controls preload="metadata" style={{ display: 'block', width: '100%', height: '130px', objectFit: 'cover', marginTop: '12px', borderRadius: '10px' }} />}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" name="active" checked={form.active} onChange={change} style={{ width: '18px', height: '18px' }} /> {t('heroPage.activeHeroSection')}
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <a href="/admin/dashboard" className="btn btn-outline">{t('common.cancel')}</a>
          <button className="btn btn-primary" disabled={saving}>{saving ? t('heroPage.saving') : t('heroPage.saveBtn')}</button>
        </div>
      </form>
      {pickerTarget && <MediaLibraryModal onClose={() => setPickerTarget(null)} onSelect={selectMedia} allowedTypes={pickerTarget === 'video' ? ['video'] : ['image']} />}
    </div>
  );
};

export default AdminHero;
