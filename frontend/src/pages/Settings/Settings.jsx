import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Settings as SettingsIcon, CheckCircle2, Volume2, ShieldCheck, Sliders, Moon } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';

export const Settings = () => {
  const { profile, updatePreferences } = useAuth();

  const [settings, setSettings] = useState({
    theme: profile.theme || 'dark',
    auto_speak: profile.auto_speak ?? true,
    confidence_threshold: profile.confidence_threshold || 0.75,
    speech_rate: profile.speech_rate || 1.0,
    preferred_language: profile.preferred_language || 'en',
    target_language: profile.target_language || 'hi',
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updatePreferences(settings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div style={{ maxWidth: '650px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={24} color="var(--accent-primary)" />
          <span>System & Accessibility Settings</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Configure accessibility features, model confidence gating, and speech output.
        </p>
      </div>

      {savedNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'var(--status-success-bg)',
            border: '1px solid var(--status-success)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-success)',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Settings successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Accessibility & Visual Contrast */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Moon size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Visual Theme & Accessibility</h2>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="theme-select">
              Interface Contrast Theme
            </label>
            <select
              id="theme-select"
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="form-select"
            >
              <option value="dark">Dark High-Contrast (Recommended for Accessibility)</option>
              <option value="light">Light Mode</option>
            </select>
          </div>
        </div>

        {/* ISL Model Sensitivity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Model Confidence Threshold</h2>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label className="form-label" htmlFor="confidence-slider">
                Minimum Sign Recognition Confidence
              </label>
              <strong style={{ color: 'var(--accent-primary)' }}>
                {Math.round(settings.confidence_threshold * 100)}%
              </strong>
            </div>
            <input
              id="confidence-slider"
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={settings.confidence_threshold}
              onChange={(e) => handleChange('confidence_threshold', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Higher values reduce false positives by requiring higher deep learning certainty before emitting signs.
            </span>
          </div>
        </div>

        {/* Speech & Audio Settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Speech Synthesis (TTS)</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Auto-Vocalize Signs (Auto-Speak)
              </strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Automatically speak newly recognized signs and sentences without clicking
              </span>
            </div>
            <input
              type="checkbox"
              id="auto-speak-toggle"
              checked={settings.auto_speak}
              onChange={(e) => handleChange('auto_speak', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
          Save All Settings
        </button>
      </form>
    </div>
  );
};

export default Settings;
