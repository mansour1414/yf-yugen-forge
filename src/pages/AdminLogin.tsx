import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { PasswordInput } from '../components/PasswordInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { CustomCursor } from '../components/CustomCursor';

export const AdminLogin: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Same env check GoogleSignInButton already makes internally — reused here
  // only to decide whether to show the "or" divider at all, per the
  // requirement that it only appears when Google auth is applicable.
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const googleRef = useRef<HTMLDivElement | null>(null);

  // Entrance choreography: one orchestrated reveal on mount, skipped entirely
  // for prefers-reduced-motion so those users simply see the finished card.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const targets = [logoRef.current, headingRef.current, subRef.current, formRef.current, googleRef.current].filter(Boolean);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(cardRef.current, { opacity: 0, y: 26, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 })
      .fromTo(targets, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.4');

    return () => {
      tl.kill();
    };
  }, []);

  // Very subtle mouse-following 3D tilt on desktop only — mirrors the same
  // pattern already used for the hero mockup tilt (Hero.tsx), disabled for
  // touch devices and reduced-motion users.
  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    if (reduced || isTouch || !wrap || !card || window.innerWidth <= 900) return;

    const handleMouseMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateX: -py * 6, rotateY: px * 6, duration: 0.6, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' });
    };

    wrap.addEventListener('mousemove', handleMouseMove);
    wrap.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      wrap.removeEventListener('mousemove', handleMouseMove);
      wrap.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const goToDestination = (roleName?: string) => {
    navigate(roleName === 'Client' ? '/account' : '/admin/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data && res.data.success) {
        await login(res.data.token, res.data.user, res.data.permissions || []);
        goToDestination(res.data.user?.role?.name);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await api.post('/api/auth/google', { credential });
      if (res.data && res.data.success) {
        await login(res.data.token, res.data.user, res.data.permissions || []);
        goToDestination(res.data.user?.role?.name);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('googleGenericError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t('googleGenericError'));
    setGoogleLoading(false);
  };

  return (
    <div className="auth-scene">
      {/* Same cinematic background system used across the rest of the admin
          shell (ProtectedRoute.tsx) — the existing Yugen Forge identity,
          not a new background. */}
      <div className="noise"></div>
      <img src="/hero-bg.jpg" alt="" id="bgImageLayer" />
      <div className="bg-overlay-veil"></div>
      <div className="bg-grid"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <CustomCursor />

      {/* Lets someone who lands here by mistake (this login is for clients
          and staff only) get back to the public site, instead of being
          stuck with no way out except closing the browser tab. */}
      <Link
        to="/"
        className="admin-icon-btn auth-close-btn"
        aria-label={t('common.close')}
        title={t('common.close')}
      >
        <X size={18} />
      </Link>

      <div style={{ position: 'absolute', top: '24px', insetInlineEnd: '24px', zIndex: 10 }}>
        <LanguageSwitcher />
      </div>

      <div className="auth-card-wrap" ref={wrapRef}>
        <div className="auth-card-glow" aria-hidden="true"></div>
        <div className="auth-card glass" ref={cardRef}>
          <span className="auth-card-corner tl" aria-hidden="true"></span>
          <span className="auth-card-corner br" aria-hidden="true"></span>

          <div className="auth-card-inner">
            <div className="auth-logo" ref={logoRef}>
              <div className="auth-logo-badge">
                <img src="/logo.svg" alt="YF Digital Studio" />
              </div>
            </div>

            <h1 className="auth-heading" ref={headingRef}>{t('portalTitle')}</h1>
            <p className="auth-subheading" ref={subRef}>{t('portalSubtitle')}</p>

            {error && (
              <div role="alert" aria-live="assertive" className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} ref={formRef}>
              <div className="field auth-input-group" style={{ marginTop: 0 }}>
                <label htmlFor="login-email">{t('emailLabel')}</label>
                <Mail size={16} className="auth-input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                />
              </div>
              <div className="field auth-input-group">
                <label htmlFor="login-password">{t('passwordLabel')}</label>
                <Lock size={16} className="auth-input-icon" aria-hidden="true" />
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ paddingInlineStart: '44px' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary magnetic auth-submit-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '28px' }}
                disabled={loading || googleLoading}
                aria-busy={loading}
              >
                <span>{loading ? t('authenticating') : t('signIn')}</span>
              </button>
            </form>

            {googleConfigured && (
              <div ref={googleRef}>
                <div className="auth-divider">
                  <span></span>
                  <span className="auth-divider-label">{t('orDivider')}</span>
                  <span></span>
                </div>

                {googleLoading && (
                  <p aria-live="polite" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '12px' }}>
                    {t('googleAuthenticating')}
                  </p>
                )}
                <div className="auth-google-wrap">
                  <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} disabled={loading || googleLoading} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
