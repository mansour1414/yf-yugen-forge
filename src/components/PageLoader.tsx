import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      position: 'relative',
      zIndex: 100,
    }}>
      <div style={{
        width: '42px',
        height: '42px',
        border: '3px solid rgba(124,58,237,0.2)',
        borderTopColor: 'var(--accent, #7C3AED)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--muted)', fontSize: '14px', letterSpacing: '0.05em' }}>Loading Studio Admin...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
