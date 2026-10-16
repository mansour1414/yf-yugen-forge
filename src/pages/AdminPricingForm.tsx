import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

export const AdminPricingForm: React.FC<{ planId?: string }> = ({ planId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = Boolean(planId);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tierAr: '',
    tierEn: '',
    price: '',
    isCustom: false,
    descAr: '',
    descEn: '',
    featured: false,
    active: true,
    displayOrder: '',
  });
  const [featuresAr, setFeaturesAr] = useState<string[]>(['']);
  const [featuresEn, setFeaturesEn] = useState<string[]>(['']);

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/api/pricing/${planId}`).then((res) => {
      const plan = res.data?.data;
      if (!plan) return;
      setForm({
        tierAr: plan.tierAr || '',
        tierEn: plan.tierEn || '',
        price: plan.price || '',
        isCustom: Boolean(plan.isCustom),
        descAr: plan.descAr || '',
        descEn: plan.descEn || '',
        featured: Boolean(plan.featured),
        active: Boolean(plan.active),
        displayOrder: String(plan.displayOrder ?? ''),
      });
      setFeaturesAr(plan.featuresAr?.length ? plan.featuresAr : ['']);
      setFeaturesEn(plan.featuresEn?.length ? plan.featuresEn : ['']);
    }).catch(() => setError(t('pricingForm.loadError'))).finally(() => setLoading(false));
  }, [isEditing, planId, t]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') setForm((current) => ({ ...current, [name]: (event.target as HTMLInputElement).checked }));
    else setForm((current) => ({ ...current, [name]: value }));
  };

  const updateFeature = (list: 'ar' | 'en', index: number, value: string) => {
    const setter = list === 'ar' ? setFeaturesAr : setFeaturesEn;
    setter((current) => current.map((item, i) => (i === index ? value : item)));
  };
  const addFeature = (list: 'ar' | 'en') => (list === 'ar' ? setFeaturesAr : setFeaturesEn)((current) => [...current, '']);
  const removeFeature = (list: 'ar' | 'en', index: number) => (list === 'ar' ? setFeaturesAr : setFeaturesEn)((current) => current.filter((_, i) => i !== index));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: form.isCustom ? (form.price.trim() || 'Custom') : form.price,
        displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder),
        featuresAr: featuresAr.map((f) => f.trim()).filter(Boolean),
        featuresEn: featuresEn.map((f) => f.trim()).filter(Boolean),
      };
      if (isEditing) await api.put(`/api/pricing/${planId}`, payload);
      else await api.post('/api/pricing', payload);
      navigate('/admin/pricing');
    } catch (requestError: any) { setError(requestError.response?.data?.error || t('pricingForm.saveError')); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('pricingForm.loadingForm')}</div>;

  const helpTextStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--muted)', marginTop: '6px', lineHeight: 1.6 };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader title={isEditing ? t('pricingForm.editTitle') : t('pricingForm.createTitle')} />
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={submit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('pricingForm.nameAr')}</label>
              <input required name="tierAr" value={form.tierAr} onChange={change} placeholder={t('pricingForm.nameArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('pricingForm.nameEn')}</label>
              <input required name="tierEn" value={form.tierEn} onChange={change} placeholder={t('pricingForm.nameEnPlaceholder')} />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px' }}>
              <input type="checkbox" name="isCustom" checked={form.isCustom} onChange={change} style={{ width: '18px', height: '18px' }} />
              {t('pricingForm.priceModeCustom')}
            </label>
            {!form.isCustom && (
              <div className="field" style={{ margin: 0 }}>
                <label>{t('pricingForm.price')}</label>
                <input required={!form.isCustom} name="price" value={form.price} onChange={change} placeholder={t('pricingForm.pricePlaceholder')} />
                <p style={helpTextStyle}>{t('pricingForm.priceHelp')}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('pricingForm.descAr')}</label>
              <textarea required name="descAr" rows={3} value={form.descAr} onChange={change} placeholder={t('pricingForm.descArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('pricingForm.descEn')}</label>
              <textarea required name="descEn" rows={3} value={form.descEn} onChange={change} placeholder={t('pricingForm.descEnPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {(['ar', 'en'] as const).map((lang) => {
              const list = lang === 'ar' ? featuresAr : featuresEn;
              return (
                <div key={lang}>
                  <label>{t(lang === 'ar' ? 'pricingForm.featuresAr' : 'pricingForm.featuresEn')}</label>
                  <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
                    {list.map((feature, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          value={feature}
                          onChange={(event) => updateFeature(lang, index, event.target.value)}
                          placeholder={t('pricingForm.featurePlaceholder')}
                          style={{ flex: 1, margin: 0 }}
                        />
                        <button type="button" className="btn btn-outline" onClick={() => removeFeature(lang, index)} style={{ padding: '6px 10px', fontSize: '12px', color: '#f87171' }}>{t('pricingForm.removeFeature')}</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-outline" onClick={() => addFeature(lang)} style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px' }}>{t('pricingForm.addFeature')}</button>
                </div>
              );
            })}
          </div>
          <p style={{ ...helpTextStyle, marginTop: '-8px' }}>{t('pricingForm.featuresHelp')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('pricingForm.displayOrder')}</label>
              <input type="number" name="displayOrder" value={form.displayOrder} onChange={change} placeholder="0" />
              <p style={helpTextStyle}>{t('pricingForm.displayOrderHelp')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="featured" checked={form.featured} onChange={change} style={{ width: '18px', height: '18px' }} /> {t('pricingForm.popularPlan')}
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="active" checked={form.active} onChange={change} style={{ width: '18px', height: '18px' }} /> {t('pricingForm.activePlan')}
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('pricingForm.saving') : t('pricingForm.saveBtn')}</button>
            <a href="/admin/pricing" className="btn btn-outline">{t('common.cancel')}</a>
          </div>
        </form>
    </div>
  );
};

export default AdminPricingForm;
