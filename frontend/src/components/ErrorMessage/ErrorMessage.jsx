import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'var(--status-error-bg)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: 'var(--radius-md)',
        color: '#fca5a5',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} color="var(--status-error)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
