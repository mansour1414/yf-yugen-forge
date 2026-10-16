import React from 'react';

interface EmptyStateProps {
  colSpan: number;
  icon?: React.ReactNode;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ colSpan, icon, message }) => (
  <tr>
    <td colSpan={colSpan} style={{ padding: '52px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
        {icon && <div style={{ opacity: 0.5 }}>{icon}</div>}
        <span style={{ fontSize: '13.5px' }}>{message}</span>
      </div>
    </td>
  </tr>
);
