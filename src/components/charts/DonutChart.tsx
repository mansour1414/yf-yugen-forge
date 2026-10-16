import React from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 168,
  strokeWidth = 20,
  centerLabel,
  centerSubLabel,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={strokeWidth} />
          {total > 0 && segments.map((s) => {
            if (s.value <= 0) return null;
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const offset = -cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={s.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray .4s var(--ease-premium)' }}
              />
            );
          })}
        </svg>
        {(centerLabel || centerSubLabel) && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {centerLabel && <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>{centerLabel}</div>}
            {centerSubLabel && <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '2px' }}>{centerSubLabel}</div>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '140px' }}>
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>{s.value} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({pct}%)</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
