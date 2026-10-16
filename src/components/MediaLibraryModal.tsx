import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { api } from '../lib/api';

export interface MediaLibraryItem {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  folderId?: string | null;
}

interface MediaLibraryModalProps {
  onClose: () => void;
  onSelect: (media: MediaLibraryItem) => void;
  allowedTypes?: Array<'image' | 'video'>;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  onClose,
  onSelect,
  allowedTypes = ['image', 'video'],
}) => {
  const { t } = useTranslation('admin');
  const [media, setMedia] = useState<MediaLibraryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    api.get('/api/media', { params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' } })
      .then((res) => setMedia(res.data?.data || []))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectableMedia = media.filter((item) => {
    const mediaType = item.mimeType.split('/')[0];
    return allowedTypes.includes(mediaType as 'image' | 'video')
      && item.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-library-title"
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(5, 1, 10, 0.84)', backdropFilter: 'blur(8px)', padding: '24px', overflowY: 'auto' }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="glass dash-fade-up" style={{ maxWidth: '960px', margin: '30px auto', padding: '28px', borderRadius: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 id="media-library-title" style={{ fontSize: '22px', fontWeight: 700 }}>{t('mediaLibraryModal.title')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '5px' }}>{t('mediaLibraryModal.subtitle')}</p>
          </div>
          <button ref={closeButtonRef} type="button" className="btn btn-outline btn-icon btn-sm" onClick={onClose} aria-label={t('mediaLibraryModal.close')}>
            <X size={15} />
          </button>
        </div>

        <div className="admin-search" style={{ width: '100%', marginBottom: '20px' }}>
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('mediaLibraryModal.searchPlaceholder')}
            aria-label={t('mediaLibraryModal.searchPlaceholder')}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dash-skeleton" style={{ height: '120px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : selectableMedia.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px' }}>{t('mediaLibraryModal.noResults')}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
            {selectableMedia.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelect(item)}
                className="dash-card"
                style={{ textAlign: 'start', cursor: 'pointer', overflow: 'hidden', padding: 0, background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '12px', color: 'var(--text)' }}
              >
                {item.mimeType.startsWith('image/') ? (
                  <img src={item.url} alt={item.name} style={{ display: 'block', width: '100%', height: '120px', objectFit: 'cover' }} />
                ) : (
                  <video src={item.url} preload="metadata" style={{ display: 'block', width: '100%', height: '120px', objectFit: 'cover', background: 'var(--bg)' }} />
                )}
                <span style={{ display: 'block', padding: '10px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
