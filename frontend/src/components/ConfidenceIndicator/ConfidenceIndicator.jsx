import React from 'react';

export const ConfidenceIndicator = ({ confidence = 0, showLabel = true }) => {
  const percent = Math.min(100, Math.max(0, Math.round((confidence || 0) * 100)));

  let color = 'var(--status-error)';
  if (percent >= 75) {
    color = 'var(--status-success)';
  } else if (percent >= 50) {
    color = 'var(--status-warning)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Confidence</span>
          <span style={{ fontWeight: 700, color }}>{percent}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--bg-input)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease-out, background-color 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
};

export default ConfidenceIndicator;
