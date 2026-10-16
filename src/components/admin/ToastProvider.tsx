import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X, LucideIcon } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_COLOR: Record<ToastTone, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--info)',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++idRef.current;
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="dash-toast-container" style={{
        position: 'fixed', bottom: '24px', insetInlineEnd: '24px', zIndex: 2000,
        display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px',
      }}>
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone];
          return (
            <div key={toast.id} className="glass dash-toast" style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '14px',
            }}>
              <Icon size={17} color={TONE_COLOR[toast.tone]} />
              <span style={{ fontSize: '13.5px', color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
              <button onClick={() => dismiss(toast.id)} style={{ color: 'var(--muted)', flexShrink: 0 }} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
