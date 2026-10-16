import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void> | void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const MAX_BUTTON_WIDTH = 340;
const MIN_BUTTON_WIDTH = 200;

let gsiScriptPromise: Promise<void> | null = null;
function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
        return;
      }
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

/**
 * "Continue with Google" button using the official Google Identity Services
 * rendered button (not a custom-styled one), so it follows Google's branding
 * requirements automatically. Renders nothing if VITE_GOOGLE_CLIENT_ID isn't set.
 *
 * The rendered button's width is measured from its wrapper (via
 * ResizeObserver) and re-rendered whenever that changes, instead of using a
 * single hardcoded pixel width. Google's renderButton API only accepts an
 * explicit pixel width (no percentage support), so a fixed width would
 * overflow — and get visually clipped or pushed off — on narrower
 * containers (e.g. the login card on small phones).
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onCredential, onError, disabled }) => {
  const { i18n } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState<number>(MAX_BUTTON_WIDTH);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  // Load the GSI script and initialize the credential callback once.
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) {
              onError('generic');
              return;
            }
            try {
              await onCredential(response.credential);
            } catch {
              onError('generic');
            }
          },
        });
        setScriptLoaded(true);
      })
      .catch(() => {
        if (!cancelled) onError('generic');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Track the wrapper's available width so the button can always be
  // rendered at a size that fits, with no horizontal overflow.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateWidth = () => {
      const width = wrapper.clientWidth;
      if (width > 0) {
        setMeasuredWidth(Math.max(MIN_BUTTON_WIDTH, Math.min(MAX_BUTTON_WIDTH, width)));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // (Re)render the actual Google button whenever the script becomes ready,
  // the language changes, or the measured width changes.
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !containerRef.current) return;
    containerRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      logo_alignment: 'left',
      width: measuredWidth,
      locale: i18n.language === 'ar' ? 'ar' : 'en',
    });
    setReady(true);
  }, [scriptLoaded, i18n.language, measuredWidth]);

  if (!clientId) return null;

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', display: 'flex', justifyContent: 'center', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <div ref={containerRef} style={{ minHeight: ready ? undefined : '44px' }} />
    </div>
  );
};

export default GoogleSignInButton;
