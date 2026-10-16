import React, { useEffect, useRef } from 'react';

interface DeleteConfirmModalProps {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title, description, cancelLabel, confirmLabel, onCancel, onConfirm, loading = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,1,10,.8)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel(); }}
    >
      <div className="glass dash-fade-up" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center', borderRadius: '18px' }}>
        <h3 id="delete-confirm-title" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{title}</h3>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>{description}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button ref={cancelRef} className="btn btn-outline" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className={`btn btn-danger btn-primary${loading ? ' btn-loading' : ''}`} onClick={onConfirm} disabled={loading}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
