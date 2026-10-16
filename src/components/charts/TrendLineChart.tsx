import React, { useState } from 'react';

export interface TrendSeries {
  label: string;
  color: string;
  data: number[];
}

interface TrendLineChartProps {
  labels: string[];
  series: TrendSeries[];
  height?: number;
}

const WIDTH = 640;

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ labels, series, height = 220 }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const padding = { top: 16, right: 14, bottom: 28, left: 14 };
  const chartW = WIDTH - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(1, ...allValues);
  // Round the axis ceiling up to a "nice" number so gridlines read cleanly.
  const niceMax = Math.ceil(maxValue / 4) * 4 || 4;

  const stepX = labels.length > 1 ? chartW / (labels.length - 1) : 0;
  const yFor = (v: number) => padding.top + chartH - (v / niceMax) * chartH;
  const xFor = (i: number) => padding.left + i * stepX;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Gridlines */}
        {gridLines.map((g) => {
          const y = padding.top + chartH * (1 - g);
          return (
            <line
              key={g}
              x1={padding.left}
              x2={WIDTH - padding.right}
              y1={y}
              y2={y}
              stroke="var(--line)"
              strokeWidth={1}
            />
          );
        })}

        {/* Series lines */}
        {series.map((s) => {
          const points = s.data.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
          const areaPoints = `${xFor(0)},${yFor(0)} ${points} ${xFor(s.data.length - 1)},${yFor(0)}`;
          return (
            <g key={s.label}>
              <polygon points={areaPoints} fill={s.color} opacity={0.06} />
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.data.map((v, i) => (
                <circle
                  key={i}
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r={hoverIdx === i ? 5 : 3.5}
                  fill={s.color}
                  stroke="var(--bg)"
                  strokeWidth={1.5}
                  style={{ transition: 'r .2s var(--ease-premium)' }}
                />
              ))}
            </g>
          );
        })}

        {/* Hover targets + x-axis labels */}
        {labels.map((label, i) => (
          <g key={label} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
            <rect
              x={xFor(i) - stepX / 2}
              y={0}
              width={stepX || WIDTH}
              height={height}
              fill="transparent"
            />
            {hoverIdx === i && (
              <line x1={xFor(i)} x2={xFor(i)} y1={padding.top} y2={padding.top + chartH} stroke="var(--line)" strokeDasharray="3 3" />
            )}
            <text
              x={xFor(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted)"
              fontFamily="var(--ff-en)"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip-ish readout for the hovered month */}
      {hoverIdx !== null && (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '4px', fontSize: '12px' }}>
          {series.map((s) => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              {s.label}: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.data[hoverIdx]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
