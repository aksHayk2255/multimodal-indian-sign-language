import React from 'react';

export const LoadingIndicator = ({ text = 'Loading...', size = 'md' }) => {
  const sizePx = size === 'sm' ? 20 : size === 'lg' ? 44 : 30;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{text}</span>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;
