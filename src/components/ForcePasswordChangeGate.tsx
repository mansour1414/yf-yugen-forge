import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from './PasswordInput';
import { Alert } from './admin/Alert';

export const ForcePasswordChangeGate: React.FC = () => {
  const { t } = useTranslation('portal');
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.mismatch'));
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        logout();
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="glass" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <img src="/logo.svg" alt="YF Studio" style={{ height: '46px', margin: '0 auto 14px' }} />
          <h1 style={{ fontSize: '21px', fontWeight: 600 }}>{t('changePassword.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '8px', lineHeight: '1.7' }}>{t('changePassword.subtitle')}</p>
        </div>

        {error && <Alert tone="error" center>{error}</Alert>}

        {success ? (
          <Alert tone="success" center>{t('changePassword.success')}</Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginTop: 0 }}>
              <label>{t('changePassword.currentLabel')}</label>
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div className="field">
              <label>{t('changePassword.newLabel')}</label>
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
            </div>
            <div className="field">
              <label>{t('changePassword.confirmLabel')}</label>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary magnetic" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }} disabled={submitting}>
              {submitting ? t('changePassword.updating') : t('changePassword.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForcePasswordChangeGate;
