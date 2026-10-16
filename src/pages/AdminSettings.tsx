import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { MediaLibraryItem, MediaLibraryModal } from '../components/MediaLibraryModal';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface SettingItem {
  id: string;
  key: string;
  value: string;
  parsedValue: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  group: 'GENERAL' | 'SEO' | 'SOCIAL' | 'CONTACT' | 'INTEGRATION';
  description?: string;
  isPublic: boolean;
}

const GROUPS = ['GENERAL', 'CONTACT', 'SEO', 'SOCIAL', 'INTEGRATION'] as const;

// Known, human-meaningful setting keys the public website already reads.
// These render as friendly labeled fields instead of raw key/value rows,
// and are always saved with isPublic:true so they actually show up on the live site.
const KNOWN_FIELDS: Record<string, Array<{ key: string; type: 'STRING' | 'BOOLEAN'; labelKey: string; helpKey?: string; placeholder?: string }>> = {
  GENERAL: [
    { key: 'footer_tagline', type: 'STRING', labelKey: 'settingsPage.fields.footerTagline', helpKey: 'settingsPage.fields.footerTaglineHelp' },
  ],
  CONTACT: [
    { key: 'contact_email', type: 'STRING', labelKey: 'settingsPage.fields.contactEmail', helpKey: 'settingsPage.fields.contactEmailHelp', placeholder: 'hello@yourcompany.com' },
    { key: 'whatsapp_number', type: 'STRING', labelKey: 'settingsPage.fields.whatsappNumber', helpKey: 'settingsPage.fields.whatsappNumberHelp', placeholder: '+966501234567' },
    { key: 'location', type: 'STRING', labelKey: 'settingsPage.fields.location', helpKey: 'settingsPage.fields.locationHelp' },
  ],
  SOCIAL: [],
};

const SOCIAL_PLATFORMS = [
  { name: 'X (Twitter)', enabledKey: 'social_x_enabled', urlKey: 'social_x_url' },
  { name: 'LinkedIn', enabledKey: 'social_linkedin_enabled', urlKey: 'social_linkedin_url' },
  { name: 'Instagram', enabledKey: 'social_instagram_enabled', urlKey: 'social_instagram_url' },
  { name: 'TikTok', enabledKey: 'social_tiktok_enabled', urlKey: 'social_tiktok_url' },
];

// New bilingual SEO keys (SEO SettingGroup). Kept in one flat list so we know exactly
// which raw keys the curated panel below owns (everything else in the SEO group still
// falls through to the generic "Advanced" editor).
const SEO_BASIC_KEYS = ['seo_title_ar', 'seo_title_en', 'seo_description_ar', 'seo_description_en', 'seo_keywords_ar', 'seo_keywords_en', 'seo_canonical_url', 'seo_image'];
const SEO_OG_KEYS = ['seo_og_title_ar', 'seo_og_title_en', 'seo_og_description_ar', 'seo_og_description_en', 'seo_og_image'];
const SEO_ROBOTS_KEYS = ['seo_robots'];
const SEO_VERIFICATION_KEYS = ['seo_google_verification', 'seo_bing_verification'];
const SEO_ALL_KEYS = [...SEO_BASIC_KEYS, ...SEO_OG_KEYS, ...SEO_ROBOTS_KEYS, ...SEO_VERIFICATION_KEYS];

// Purely legacy keys (no longer written by the curated panel, kept only for
// backward-compatible fallback reading in SEO.tsx) — hidden from the Advanced list
// for the SEO group so the panel doesn't look cluttered/duplicated.
const SEO_LEGACY_ONLY_KEYS = ['seo_title', 'seo_description', 'seo_keywords'];

// Maps each new bilingual key to the old single-language key it can fall back to,
// used only as a one-time display fallback so an admin who already set the old keys
// doesn't see a blank form the first time they open the new panel — nothing is written
// back to the database until they press Save.
const SEO_LEGACY_FALLBACK: Record<string, string> = {
  seo_title_ar: 'seo_title',
  seo_title_en: 'seo_title',
  seo_description_ar: 'seo_description',
  seo_description_en: 'seo_description',
  seo_keywords_ar: 'seo_keywords',
  seo_keywords_en: 'seo_keywords',
};

export const AdminSettings: React.FC = () => {
  const { t } = useTranslation('admin');
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('GENERAL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [groupValues, setGroupValues] = useState<Record<string, any>>({});
  const [knownValues, setKnownValues] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'>('STRING');
  const [newDescription, setNewDescription] = useState('');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'seo_image' | 'seo_og_image' | null>(null);
  const newKeyInputRef = useRef<HTMLInputElement>(null);

  const groupLabel = (group: string) => t(`settingsPage.groups.${group.toLowerCase()}`);

  const knownKeysForGroup = useMemo(() => {
    const list = new Set((KNOWN_FIELDS[activeGroup] || []).map((f) => f.key));
    if (activeGroup === 'SOCIAL') {
      SOCIAL_PLATFORMS.forEach((p) => { list.add(p.enabledKey); list.add(p.urlKey); });
    }
    if (activeGroup === 'SEO') {
      SEO_ALL_KEYS.forEach((key) => list.add(key));
    }
    return list;
  }, [activeGroup]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/settings');
      const items: SettingItem[] = res.data?.data || [];
      setSettings(items);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('settingsPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const byKey: Record<string, SettingItem> = {};
    settings.forEach((s) => { byKey[s.key] = s; });

    const known: Record<string, any> = {};
    knownKeysForGroup.forEach((key) => {
      const existing = byKey[key];
      if (existing) {
        known[key] = existing.parsedValue !== undefined ? existing.parsedValue : existing.value;
        return;
      }
      // Backward compatibility: fall back to the old single-language seo_* keys for
      // display only, so the new panel isn't blank the first time it's opened.
      const legacyKey = SEO_LEGACY_FALLBACK[key];
      const legacy = legacyKey ? byKey[legacyKey] : undefined;
      if (legacy) {
        known[key] = legacy.parsedValue !== undefined ? legacy.parsedValue : legacy.value;
        return;
      }
      known[key] = key.includes('_enabled') ? false : '';
    });
    setKnownValues(known);

    const otherItems = settings.filter((s) => s.group === activeGroup && !knownKeysForGroup.has(s.key) && !(activeGroup === 'SEO' && SEO_LEGACY_ONLY_KEYS.includes(s.key)));
    const map: Record<string, any> = {};
    otherItems.forEach((s) => { map[s.key] = s.parsedValue !== undefined ? s.parsedValue : s.value; });
    setGroupValues(map);
    setShowAdvanced(false);
  }, [activeGroup, settings, knownKeysForGroup]);

  const handleKnownChange = (key: string, value: any) => setKnownValues((current) => ({ ...current, [key]: value }));
  const handleChange = (key: string, value: any) => setGroupValues((current) => ({ ...current, [key]: value }));

  const saveKnownFields = async (keys: string[], successMsg: string) => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = keys.map((key) => ({ key, value: knownValues[key], group: activeGroup, isPublic: true }));
      await api.put('/api/settings', { settings: payload });
      setSuccess(successMsg);
      await fetchSettings();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('settingsPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await api.put(`/api/settings/group/${activeGroup}`, groupValues);
      setSuccess(t('settingsPage.saveSuccess', { group: groupLabel(activeGroup) }));
      await fetchSettings();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('settingsPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      let val: any = newValue;
      if (newType === 'NUMBER') val = Number(newValue);
      if (newType === 'BOOLEAN') val = newValue === 'true';
      if (newType === 'JSON') {
        try {
          val = JSON.parse(newValue);
        } catch {
          throw new Error(t('settingsPage.invalidJson'));
        }
      }

      await api.put('/api/settings', { settings: [{ key: newKey.trim(), value: val, description: newDescription.trim() || undefined, group: activeGroup }] });
      setNewKey('');
      setNewValue('');
      setNewDescription('');
      setSuccess(t('settingsPage.addSuccess'));
      await fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('settingsPage.addError'));
    }
  };

  const fieldHelpStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--muted)', marginTop: '5px', lineHeight: 1.6 };
  const currentGroupSettings = settings.filter((s) => s.group === activeGroup && !knownKeysForGroup.has(s.key) && !(activeGroup === 'SEO' && SEO_LEGACY_ONLY_KEYS.includes(s.key)));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader title={t('settingsPage.title')} subtitle={t('settingsPage.subtitle')} />

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {GROUPS.map((group) => (
          <button key={group} type="button" onClick={() => setActiveGroup(group)} className={`btn ${activeGroup === group ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '13px', padding: '10px 18px' }}>
            {groupLabel(group)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass dash-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>{t('settingsPage.loadingSettings')}</div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
            {/* Curated, human-friendly fields */}
            {activeGroup === 'GENERAL' && (
              <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '18px' }}>
                {KNOWN_FIELDS.GENERAL.map((field) => (
                  <div key={field.key} className="field" style={{ margin: 0 }}>
                    <label>{t(field.labelKey)}</label>
                    <input value={knownValues[field.key] || ''} onChange={(e) => handleKnownChange(field.key, e.target.value)} placeholder={field.placeholder} />
                    {field.helpKey && <p style={fieldHelpStyle}>{t(field.helpKey)}</p>}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(KNOWN_FIELDS.GENERAL.map((f) => f.key), t('settingsPage.saveSuccess', { group: groupLabel('GENERAL') }))}>
                    {saving ? t('settingsPage.saving') : t('settingsPage.fields.saveGeneral')}
                  </button>
                </div>
              </div>
            )}

            {activeGroup === 'CONTACT' && (
              <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '18px' }}>
                {KNOWN_FIELDS.CONTACT.map((field) => (
                  <div key={field.key} className="field" style={{ margin: 0 }}>
                    <label>{t(field.labelKey)}</label>
                    <input value={knownValues[field.key] || ''} onChange={(e) => handleKnownChange(field.key, e.target.value)} placeholder={field.placeholder} dir="ltr" style={{ textAlign: 'left' }} />
                    {field.helpKey && <p style={fieldHelpStyle}>{t(field.helpKey)}</p>}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(KNOWN_FIELDS.CONTACT.map((f) => f.key), t('settingsPage.fields.saveContactInfo'))}>
                    {saving ? t('settingsPage.saving') : t('settingsPage.fields.saveContactInfo')}
                  </button>
                </div>
              </div>
            )}

            {activeGroup === 'SOCIAL' && (
              <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '22px' }}>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div key={platform.enabledKey} style={{ display: 'grid', gap: '10px', paddingBottom: '18px', borderBottom: '1px solid var(--line)' }}>
                    <strong style={{ fontSize: '14px' }}>{platform.name}</strong>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                      <input type="checkbox" checked={Boolean(knownValues[platform.enabledKey])} onChange={(e) => handleKnownChange(platform.enabledKey, e.target.checked)} style={{ width: '17px', height: '17px' }} />
                      {t('settingsPage.fields.socialEnable')}
                    </label>
                    <input value={knownValues[platform.urlKey] || ''} onChange={(e) => handleKnownChange(platform.urlKey, e.target.value)} placeholder="https://..." dir="ltr" style={{ textAlign: 'left', margin: 0 }} />
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(Array.from(knownKeysForGroup), t('settingsPage.fields.saveSocialLinks'))}>
                    {saving ? t('settingsPage.saving') : t('settingsPage.fields.saveSocialLinks')}
                  </button>
                </div>
              </div>
            )}

            {activeGroup === 'SEO' && (
              <>
                {/* Basic SEO */}
                <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{t('settingsPage.seoFields.sectionBasic')}</h3>
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.sectionBasicHelp')}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.titleAr')}</label>
                      <input value={knownValues.seo_title_ar || ''} onChange={(e) => handleKnownChange('seo_title_ar', e.target.value)} placeholder={t('settingsPage.seoFields.titleArPlaceholder')} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.titleEn')}</label>
                      <input value={knownValues.seo_title_en || ''} onChange={(e) => handleKnownChange('seo_title_en', e.target.value)} placeholder={t('settingsPage.seoFields.titleEnPlaceholder')} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                  </div>
                  <p style={{ ...fieldHelpStyle, marginTop: '-10px' }}>{t('settingsPage.seoFields.titleHelp')}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.descriptionAr')}</label>
                      <textarea rows={3} value={knownValues.seo_description_ar || ''} onChange={(e) => handleKnownChange('seo_description_ar', e.target.value)} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.descriptionEn')}</label>
                      <textarea rows={3} value={knownValues.seo_description_en || ''} onChange={(e) => handleKnownChange('seo_description_en', e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                  </div>
                  <p style={{ ...fieldHelpStyle, marginTop: '-10px' }}>{t('settingsPage.seoFields.descriptionHelp')}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.keywordsAr')}</label>
                      <input value={knownValues.seo_keywords_ar || ''} onChange={(e) => handleKnownChange('seo_keywords_ar', e.target.value)} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.keywordsEn')}</label>
                      <input value={knownValues.seo_keywords_en || ''} onChange={(e) => handleKnownChange('seo_keywords_en', e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                  </div>
                  <p style={{ ...fieldHelpStyle, marginTop: '-10px' }}>{t('settingsPage.seoFields.keywordsHelp')}</p>

                  <div className="field" style={{ margin: 0 }}>
                    <label>{t('settingsPage.seoFields.canonicalUrl')}</label>
                    <input value={knownValues.seo_canonical_url || ''} onChange={(e) => handleKnownChange('seo_canonical_url', e.target.value)} placeholder={t('settingsPage.seoFields.canonicalUrlPlaceholder')} dir="ltr" style={{ textAlign: 'left' }} />
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.canonicalUrlHelp')}</p>
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <label>{t('settingsPage.seoFields.image')}</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input type="url" value={knownValues.seo_image || ''} onChange={(e) => handleKnownChange('seo_image', e.target.value)} placeholder="https://..." dir="ltr" style={{ flex: 1, textAlign: 'left' }} />
                      <button type="button" className="btn btn-outline" onClick={() => setMediaPickerTarget('seo_image')} style={{ whiteSpace: 'nowrap' }}>{t('settingsPage.seoFields.selectFromLibrary')}</button>
                    </div>
                    {knownValues.seo_image && <img src={knownValues.seo_image} alt="" style={{ width: '100%', maxWidth: '260px', height: '130px', objectFit: 'cover', marginTop: '10px', borderRadius: '10px', border: '1px solid var(--line)' }} />}
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.imageHelp')}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(SEO_BASIC_KEYS, t('settingsPage.seoFields.saveBasic'))}>
                      {saving ? t('settingsPage.saving') : t('settingsPage.seoFields.saveBasic')}
                    </button>
                  </div>
                </div>

                {/* Open Graph */}
                <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{t('settingsPage.seoFields.sectionOg')}</h3>
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.sectionOgHelp')}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.ogTitleAr')}</label>
                      <input value={knownValues.seo_og_title_ar || ''} onChange={(e) => handleKnownChange('seo_og_title_ar', e.target.value)} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.ogTitleEn')}</label>
                      <input value={knownValues.seo_og_title_en || ''} onChange={(e) => handleKnownChange('seo_og_title_en', e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.ogDescriptionAr')}</label>
                      <textarea rows={3} value={knownValues.seo_og_description_ar || ''} onChange={(e) => handleKnownChange('seo_og_description_ar', e.target.value)} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.ogDescriptionEn')}</label>
                      <textarea rows={3} value={knownValues.seo_og_description_en || ''} onChange={(e) => handleKnownChange('seo_og_description_en', e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <label>{t('settingsPage.seoFields.ogImage')}</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input type="url" value={knownValues.seo_og_image || ''} onChange={(e) => handleKnownChange('seo_og_image', e.target.value)} placeholder="https://..." dir="ltr" style={{ flex: 1, textAlign: 'left' }} />
                      <button type="button" className="btn btn-outline" onClick={() => setMediaPickerTarget('seo_og_image')} style={{ whiteSpace: 'nowrap' }}>{t('settingsPage.seoFields.selectFromLibrary')}</button>
                    </div>
                    {knownValues.seo_og_image && <img src={knownValues.seo_og_image} alt="" style={{ width: '100%', maxWidth: '260px', height: '130px', objectFit: 'cover', marginTop: '10px', borderRadius: '10px', border: '1px solid var(--line)' }} />}
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.ogImageHelp')}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(SEO_OG_KEYS, t('settingsPage.seoFields.saveOg'))}>
                      {saving ? t('settingsPage.saving') : t('settingsPage.seoFields.saveOg')}
                    </button>
                  </div>
                </div>

                {/* Robots */}
                <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{t('settingsPage.seoFields.sectionRobots')}</h3>
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.sectionRobotsHelp')}</p>
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>{t('settingsPage.seoFields.robots')}</label>
                    <select
                      value={knownValues.seo_robots || 'index, follow'}
                      onChange={(e) => handleKnownChange('seo_robots', e.target.value)}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)' }}
                    >
                      <option value="index, follow">{t('settingsPage.seoFields.robotsIndexFollow')}</option>
                      <option value="noindex, nofollow">{t('settingsPage.seoFields.robotsNoindexNofollow')}</option>
                      <option value="noindex, follow">{t('settingsPage.seoFields.robotsNoindexFollow')}</option>
                      <option value="index, nofollow">{t('settingsPage.seoFields.robotsIndexNofollow')}</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(SEO_ROBOTS_KEYS, t('settingsPage.seoFields.saveRobots'))}>
                      {saving ? t('settingsPage.saving') : t('settingsPage.seoFields.saveRobots')}
                    </button>
                  </div>
                </div>

                {/* Verification */}
                <div className="glass dash-card" style={{ padding: '32px', display: 'grid', gap: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{t('settingsPage.seoFields.sectionVerification')}</h3>
                    <p style={fieldHelpStyle}>{t('settingsPage.seoFields.sectionVerificationHelp')}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.googleVerification')}</label>
                      <input value={knownValues.seo_google_verification || ''} onChange={(e) => handleKnownChange('seo_google_verification', e.target.value)} placeholder={t('settingsPage.seoFields.googleVerificationPlaceholder')} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>{t('settingsPage.seoFields.bingVerification')}</label>
                      <input value={knownValues.seo_bing_verification || ''} onChange={(e) => handleKnownChange('seo_bing_verification', e.target.value)} dir="ltr" style={{ textAlign: 'left' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" disabled={saving} onClick={() => saveKnownFields(SEO_VERIFICATION_KEYS, t('settingsPage.seoFields.saveVerification'))}>
                      {saving ? t('settingsPage.saving') : t('settingsPage.seoFields.saveVerification')}
                    </button>
                  </div>
                </div>
              </>
            )}
            {activeGroup === 'INTEGRATION' && (
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{t('settingsPage.fields.integrationIntro')}</p>
            )}

            {/* Advanced / raw settings toggle */}
            <div>
              <button type="button" className="btn btn-outline" style={{ fontSize: '12.5px' }} onClick={() => setShowAdvanced((v) => !v)}>
                {showAdvanced ? t('settingsPage.fields.advancedToggleHide') : t('settingsPage.fields.advancedToggleShow')}
              </button>
            </div>

            {showAdvanced && (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '-10px' }}>{t('settingsPage.fields.advancedIntro')}</p>
                <form onSubmit={handleSaveGroup} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 600 }}>{t('settingsPage.groupLabel', { group: groupLabel(activeGroup) })}</h3>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? t('settingsPage.saving') : t('settingsPage.saveGroupBtn', { group: groupLabel(activeGroup) })}
                    </button>
                  </div>

                  {currentGroupSettings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>{t('settingsPage.noSettingsInGroup')}</p>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '13px' }}
                        onClick={() => {
                          newKeyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          newKeyInputRef.current?.focus();
                        }}
                      >
                        {t('settingsPage.addSettingToGroup', { group: groupLabel(activeGroup) })}
                      </button>
                    </div>
                  ) : (
                    currentGroupSettings.map((s) => {
                      const val = groupValues[s.key] !== undefined ? groupValues[s.key] : s.parsedValue;
                      return (
                        <div key={s.id || s.key} className="field" style={{ margin: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text)' }}>{s.key}</label>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{t('settingsPage.typeLabel', { type: s.type })} {s.isPublic ? `• ${t('settingsPage.publicLabel')}` : ''}</span>
                          </div>
                          {s.description && <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>{s.description}</p>}

                          {s.type === 'BOOLEAN' ? (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={Boolean(val)} onChange={(e) => handleChange(s.key, e.target.checked)} style={{ width: '18px', height: '18px' }} />
                              {t('settingsPage.enableActive')}
                            </label>
                          ) : s.type === 'NUMBER' ? (
                            <input type="number" value={val !== undefined ? val : ''} onChange={(e) => handleChange(s.key, e.target.value === '' ? '' : Number(e.target.value))} />
                          ) : s.type === 'JSON' ? (
                            <textarea rows={4} value={typeof val === 'object' ? JSON.stringify(val, null, 2) : val} onChange={(e) => handleChange(s.key, e.target.value)} placeholder={t('settingsPage.jsonPlaceholder')} />
                          ) : (
                            <input type="text" value={val !== undefined ? val : ''} onChange={(e) => handleChange(s.key, e.target.value)} />
                          )}
                        </div>
                      );
                    })
                  )}
                </form>

                <form onSubmit={handleAddSetting} className="glass dash-card" style={{ padding: '30px', display: 'grid', gap: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{t('settingsPage.addUpsertTitle')} <span style={{ color: 'var(--accent)', fontWeight: 500 }}>→ {groupLabel(activeGroup)}</span></h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <input ref={newKeyInputRef} required placeholder={t('settingsPage.keyPlaceholder')} value={newKey} onChange={(e) => setNewKey(e.target.value)} />
                    <select value={newType} onChange={(e) => setNewType(e.target.value as any)} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)' }}>
                      <option value="STRING">STRING</option>
                      <option value="NUMBER">NUMBER</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                      <option value="JSON">JSON</option>
                    </select>
                    <input placeholder={t('settingsPage.valuePlaceholder')} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                    <input placeholder={t('settingsPage.descriptionPlaceholder')} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-outline" style={{ fontSize: '13px' }}>{t('settingsPage.addSettingBtn')}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      {mediaPickerTarget && (
        <MediaLibraryModal
          onClose={() => setMediaPickerTarget(null)}
          onSelect={(media: MediaLibraryItem) => {
            handleKnownChange(mediaPickerTarget, media.url);
            setMediaPickerTarget(null);
          }}
          allowedTypes={['image']}
        />
      )}
    </div>
  );
};

export default AdminSettings;
