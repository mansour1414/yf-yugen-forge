import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      width: '100%',
      color: 'var(--accent)',
      fontFamily: 'var(--ff-en)',
      letterSpacing: '2px',
      fontSize: '14px'
    }}>
      LOADING...
    </div>
  );
};
