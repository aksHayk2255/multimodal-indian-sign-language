import React from 'react';
import { Camera, CameraOff, Video, AlertTriangle, RefreshCw, Activity, Hand } from 'lucide-react';

export const WebcamPanel = ({
  videoRef,
  canvasRef,
  isActive,
  isLoading,
  hasPermission,
  error,
  isRecognizing,
  trackingStats = {},
  onStartRecognizing,
  onStopRecognizing,
  onToggleCamera,
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Webcam Stream</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isActive ? (
            <span className="badge badge-success">● Camera Active</span>
          ) : (
            <span className="badge badge-warning">○ Camera Inactive</span>
          )}

          {isActive && (
            trackingStats.hasHands ? (
              <span className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981' }}>
                <Hand size={12} style={{ marginRight: '4px' }} />
                Hands Tracked
              </span>
            ) : (
              <span className="badge badge-warning" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                ○ Hands Idle (Raise to Sign)
              </span>
            )
          )}

          {isRecognizing && (
            <span className="badge badge-info" style={{ animation: 'pulse 1.5s infinite' }}>
              Recognizing...
            </span>
          )}
        </div>
      </div>

      {/* Video Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          backgroundColor: '#0a0d14',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror preview for natural gesture intuition
            display: isActive ? 'block' : 'none',
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: 'scaleX(-1)', // Mirrored matching video
            display: isActive ? 'block' : 'none',
          }}
        />

        {/* Inactive State / Permissions guide */}
        {!isActive && !isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
              }}
            >
              <CameraOff size={32} color="var(--text-muted)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Camera is turned off
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                {hasPermission === false
                  ? 'Camera permission denied. Please allow access in browser.'
                  : 'Start camera to enable real-time sign recognition'}
              </p>
            </div>
            <button onClick={onToggleCamera} className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Camera size={18} />
              <span>Turn On Camera</span>
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Initializing Camera Stream...</p>
          </div>
        )}

        {/* Scan line visual guide when recognition is active */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '8%',
              right: '8%',
              bottom: '8%',
              border: isRecognizing ? '2px dashed rgba(59, 130, 246, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 12,
                backgroundColor: 'rgba(15, 20, 28, 0.85)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
              }}
            >
              {isRecognizing
                ? (trackingStats.hasHands ? '⚡ Active Hand Signing Detected' : 'Hands Resting — Raise Hands to Begin Signing')
                : 'Position Hands and Torso Inside Frame'}
            </div>

            {/* Skeleton joint telemetry indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 12,
                backgroundColor: 'rgba(15, 20, 28, 0.85)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                color: trackingStats.hasHands ? '#34d399' : '#eab308',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Activity size={12} />
              <span>
                {trackingStats.hasHands
                  ? `Signing Space Active (${trackingStats.rightHand ? 'R' : ''}${trackingStats.rightHand && trackingStats.leftHand ? '+' : ''}${trackingStats.leftHand ? 'L' : ''} Hand)`
                  : 'Hands at rest — Ready for sign'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'var(--status-error-bg)',
            border: '1px solid var(--status-error)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={onToggleCamera}
          className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
          style={{ flex: 1 }}
        >
          {isActive ? <CameraOff size={18} /> : <Camera size={18} />}
          <span>{isActive ? 'Stop Camera' : 'Start Camera'}</span>
        </button>

        {isActive && (
          <button
            onClick={isRecognizing ? onStopRecognizing : onStartRecognizing}
            className={`btn ${isRecognizing ? 'btn-danger' : 'btn-success'}`}
            style={{ flex: 1.5 }}
          >
            <span>{isRecognizing ? '■ Stop Recognition' : '▶ Start Recognition'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamPanel;
