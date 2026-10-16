import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type AlertTone = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  tone: AlertTone;
  children: React.ReactNode;
  /** Centers the text instead of the default start-aligned layout (matches a few pages that previously centered their inline banners). */
  center?: boolean;
}

const TONE_ICON: Record<AlertTone, React.ElementType> = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Shared inline status banner for form/page-level feedback (validation
 * errors, save confirmations, etc). Consolidates what used to be ~27
 * separately hand-written inline `<div style={{...}}>` blocks scattered
 * across the admin panel and client portal — same visual result, one place
 * to maintain it, and consistent semantic color tokens (see :root in
 * index.css) instead of hardcoded hex values per file.
 */
export const Alert: React.FC<AlertProps> = ({ tone, children, center = false }) => {
  const Icon = TONE_ICON[tone];
  return (
    <div className={`admin-alert admin-alert-${tone}`} role="alert" aria-live="assertive" style={center ? { justifyContent: 'center', textAlign: 'center' } : undefined}>
      <Icon size={16} className="admin-alert-icon" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
};

export default Alert;
