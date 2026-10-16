import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '5px' }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</div>}
  </div>
);
