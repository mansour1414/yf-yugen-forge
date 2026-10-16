import React from 'react';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} style={{ borderBottom: '1px solid var(--line)' }}>
        {Array.from({ length: columns }).map((_, colIdx) => (
          <td key={colIdx} style={{ padding: '16px' }}>
            <div className="dash-skeleton" style={{ height: '14px', width: colIdx === 0 ? '70%' : '50%', borderRadius: '6px' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);
