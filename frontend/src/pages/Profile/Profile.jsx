import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, CheckCircle2, Shield, Calendar } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

export const Profile = () => {
  const { user, profile, updatePreferences } = useAuth();
  const [preferredLang, setPreferredLang] = useState(profile.preferred_language || 'en');
  const [targetLang, setTargetLang] = useState(profile.target_language || 'hi');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await updatePreferences({
      preferred_language: preferredLang,
      target_language: targetLang,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={24} color="var(--accent-primary)" />
          <span>User Profile</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Manage your account information and default language preferences.
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
          <span>Profile preferences saved successfully!</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          Account Details
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Username:</span>
          <strong>{user?.username || 'Guest / Local User'}</strong>

          <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
          <span>{user?.email || 'Not configured'}</span>

          <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
          <span>{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Not specified'}</span>
        </div>
      </div>

      {/* Language Preferences Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          Language Preferences
        </h2>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <LanguageSelector
              label="Primary Native Language (Input):"
              value={preferredLang}
              onChange={setPreferredLang}
              id="profile-pref-lang"
            />
          </div>

          <div className="form-group">
            <LanguageSelector
              label="Default Target Language (Translation / Speech):"
              value={targetLang}
              onChange={setTargetLang}
              id="profile-target-lang"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
