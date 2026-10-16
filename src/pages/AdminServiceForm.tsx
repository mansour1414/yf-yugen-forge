import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

export const AdminServiceForm: React.FC<{ serviceId?: string }> = ({ serviceId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = Boolean(serviceId);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: '',
    color: 'var(--accent)',
    featured: false,
    active: true,
    displayOrder: ''
  });

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/api/services/${serviceId}`).then((res) => {
      const service = res.data?.data;
      if (!service) return;
      setForm({
        titleAr: service.titleAr || service.title || '',
        titleEn: service.titleEn || '',
        descriptionAr: service.descriptionAr || service.description || '',
        descriptionEn: service.descriptionEn || '',
        icon: service.icon || '',
        color: service.color || 'var(--accent)',
        featured: Boolean(service.featured),
        active: Boolean(service.active),
        displayOrder: String(service.displayOrder ?? '')
      });
    }).catch(() => setError(t('serviceForm.loadError'))).finally(() => setLoading(false));
  }, [isEditing, serviceId, t]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') setForm((current) => ({ ...current, [name]: (event.target as HTMLInputElement).checked }));
    else setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        title: form.titleAr || form.titleEn || 'Service',
        description: form.descriptionAr || form.descriptionEn || 'Description',
        displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder)
      };
      if (isEditing) await api.put(`/api/services/${serviceId}`, payload);
      else await api.post('/api/services', payload);
      navigate('/admin/services');
    } catch (requestError: any) { setError(requestError.response?.data?.error || t('serviceForm.saveError')); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('serviceForm.loadingForm')}</div>;
  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader title={isEditing ? t('serviceForm.editTitle') : t('serviceForm.createTitle')} />
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={submit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.titleAr')}</label>
              <input required name="titleAr" value={form.titleAr} onChange={change} placeholder={t('serviceForm.titleArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.titleEn')}</label>
              <input required name="titleEn" value={form.titleEn} onChange={change} placeholder={t('serviceForm.titleEnPlaceholder')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.descAr')}</label>
              <textarea required name="descriptionAr" rows={4} value={form.descriptionAr} onChange={change} placeholder={t('serviceForm.descArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.descEn')}</label>
              <textarea required name="descriptionEn" rows={4} value={form.descriptionEn} onChange={change} placeholder={t('serviceForm.descEnPlaceholder')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.icon')}</label>
              <input required name="icon" value={form.icon} onChange={change} placeholder={t('serviceForm.iconPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.displayOrder')}</label>
              <input type="number" name="displayOrder" value={form.displayOrder} onChange={change} placeholder="0" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('serviceForm.color')}</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} style={{ width: '46px', padding: '4px', height: '42px' }} />
                <input required name="color" value={form.color} onChange={change} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', paddingTop: '28px' }}>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="featured" checked={form.featured} onChange={change} style={{ width: '18px', height: '18px' }} /> {t('serviceForm.featured')}
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="active" checked={form.active} onChange={change} style={{ width: '18px', height: '18px' }} /> {t('serviceForm.active')}
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('serviceForm.saving') : t('serviceForm.saveBtn')}</button>
            <a href="/admin/services" className="btn btn-outline">{t('common.cancel')}</a>
          </div>
        </form>
    </div>
  );
};

export default AdminServiceForm;
