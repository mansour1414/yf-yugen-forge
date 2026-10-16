import React from 'react';

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_STYLES: Record<PillTone, { bg: string; color: string }> = {
  success: { bg: 'var(--success-bg)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning-strong)' },
  danger: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
  info: { bg: 'var(--info-bg)', color: 'var(--info)' },
  neutral: { bg: 'rgba(255,255,255,.06)', color: 'var(--muted)' },
};

interface StatusPillProps {
  label: string;
  tone: PillTone;
}

export const StatusPill: React.FC<StatusPillProps> = ({ label, tone }) => {
  const s = TONE_STYLES[tone];
  return (
    <span style={{
      padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
};
