import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { MediaLibraryItem, MediaLibraryModal } from '../components/MediaLibraryModal';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

export const AdminTestimonialForm: React.FC<{ testimonialId?: string }> = ({ testimonialId }) => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isEditing = Boolean(testimonialId);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    positionAr: '',
    positionEn: '',
    avatar: '',
    rating: 5,
    contentAr: '',
    contentEn: '',
    featured: false,
    displayOrder: '',
  });

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/api/testimonials/${testimonialId}`)
      .then((res) => {
        const item = res.data?.data;
        if (!item) return;
        setForm({
          name: item.name || '',
          company: item.company || '',
          positionAr: item.positionAr || item.position || '',
          positionEn: item.positionEn || '',
          avatar: item.avatar || '',
          rating: item.rating ?? 5,
          contentAr: item.contentAr || item.content || '',
          contentEn: item.contentEn || '',
          featured: Boolean(item.featured),
          displayOrder: item.displayOrder !== undefined ? String(item.displayOrder) : '',
        });
      })
      .catch(() => setError(t('testimonialForm.loadError')))
      .finally(() => setLoading(false));
  }, [isEditing, testimonialId, t]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') {
      setForm((current) => ({ ...current, [name]: (event.target as HTMLInputElement).checked }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const handleSelectMedia = (media: MediaLibraryItem) => {
    setForm((current) => ({ ...current, avatar: media.url }));
    setShowMediaModal(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        content: form.contentAr || form.contentEn || 'Testimonial feedback',
        position: form.positionAr || form.positionEn || null,
        rating: Number(form.rating),
        displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder),
        avatar: form.avatar || null,
      };
      if (isEditing) {
        await api.put(`/api/testimonials/${testimonialId}`, payload);
      } else {
        await api.post('/api/testimonials', payload);
      }
      navigate('/admin/testimonials');
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('testimonialForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('testimonialForm.loadingForm')}</div>;
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader title={isEditing ? t('testimonialForm.editTitle') : t('testimonialForm.createTitle')} />

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={submit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.clientName')}</label>
              <input required name="name" value={form.name} onChange={change} placeholder={t('testimonialForm.clientNamePlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.company')}</label>
              <input required name="company" value={form.company} onChange={change} placeholder={t('testimonialForm.companyPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.positionAr')}</label>
              <input name="positionAr" value={form.positionAr} onChange={change} placeholder={t('testimonialForm.positionArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.positionEn')}</label>
              <input name="positionEn" value={form.positionEn} onChange={change} placeholder={t('testimonialForm.positionEnPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.rating')}</label>
              <select name="rating" value={form.rating} onChange={change} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)' }}>
                <option value={5}>5 ★★★★★</option>
                <option value={4}>4 ★★★★☆</option>
                <option value={3}>3 ★★★☆☆</option>
                <option value={2}>2 ★★☆☆☆</option>
                <option value={1}>1 ★☆☆☆☆</option>
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.displayOrder')}</label>
              <input type="number" name="displayOrder" value={form.displayOrder} onChange={change} placeholder="0" />
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('testimonialForm.avatarUrl')}</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="url" name="avatar" value={form.avatar} onChange={change} placeholder="https://..." style={{ flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setShowMediaModal(true)} style={{ whiteSpace: 'nowrap' }}>{t('testimonialForm.selectFromLibrary')}</button>
            </div>
            {form.avatar && (
              <img src={form.avatar} alt={t('testimonialForm.avatarPreviewAlt')} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px', border: '1px solid var(--line)' }} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.contentAr')}</label>
              <textarea required name="contentAr" rows={4} value={form.contentAr} onChange={change} placeholder={t('testimonialForm.contentArPlaceholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('testimonialForm.contentEn')}</label>
              <textarea required name="contentEn" rows={4} value={form.contentEn} onChange={change} placeholder={t('testimonialForm.contentEnPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" name="featured" checked={form.featured} onChange={change} style={{ width: '18px', height: '18px' }} />
              {t('testimonialForm.featuredTestimonial')}
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <a href="/admin/testimonials" className="btn btn-outline">{t('common.cancel')}</a>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? t('testimonialForm.saving') : isEditing ? t('testimonialForm.updateBtn') : t('testimonialForm.createBtn')}
            </button>
          </div>
        </form>

      {showMediaModal && (
        <MediaLibraryModal onClose={() => setShowMediaModal(false)} onSelect={handleSelectMedia} allowedTypes={['image']} />
      )}
    </div>
  );
};

export default AdminTestimonialForm;
