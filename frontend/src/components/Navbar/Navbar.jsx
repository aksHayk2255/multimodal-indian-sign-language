import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Video,
  Mic,
  MessageSquare,
  History,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import LanguageSelector from '../LanguageSelector/LanguageSelector';

export const Navbar = () => {
  const { user, profile, updatePreferences, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    const nextTheme = profile.theme === 'light' ? 'dark' : 'light';
    updatePreferences({ theme: nextTheme });
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sign-language', label: 'ISL Translator', icon: Video },
    { to: '/speech', label: 'Speech Mode', icon: Mic },
    { to: '/conversation', label: 'Conversation', icon: MessageSquare },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
            }}
          >
            ISL
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              ISL Assistant
            </span>
            <span
              className="badge badge-info"
              style={{ marginLeft: '8px', fontSize: '0.7rem', verticalAlign: 'middle' }}
            >
              Multimodal AI
            </span>
          </div>
        </Link>

        {/* Main Navigation */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-label="Main Navigation"
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utilities & User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={18} color="var(--text-secondary)" />
            <LanguageSelector
              label=""
              value={profile.preferred_language}
              onChange={(lang) => updatePreferences({ preferred_language: lang })}
            />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            title={`Switch to ${profile.theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle visual theme"
            style={{ padding: '8px 12px', minHeight: 'auto' }}
          >
            {profile.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Settings link */}
          <Link
            to="/settings"
            className="btn btn-secondary"
            title="System Settings"
            aria-label="Settings"
            style={{ padding: '8px 12px', minHeight: 'auto' }}
          >
            <Settings size={18} />
          </Link>

          {/* Auth State */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to="/profile"
                className="btn btn-secondary"
                style={{ padding: '8px 14px', minHeight: 'auto', gap: '6px' }}
              >
                <User size={16} />
                <span>{user?.username || 'Profile'}</span>
              </Link>
              <button
                onClick={logout}
                className="btn btn-secondary"
                title="Log Out"
                aria-label="Log Out"
                style={{ padding: '8px 12px', minHeight: 'auto' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 14px', minHeight: 'auto' }}>
                <LogIn size={16} />
                <span>Log In</span>
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 14px', minHeight: 'auto' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
