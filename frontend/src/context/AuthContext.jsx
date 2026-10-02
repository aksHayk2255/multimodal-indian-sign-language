import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    preferred_language: 'en',
    target_language: 'hi',
    theme: 'dark',
    auto_speak: true,
    confidence_threshold: 0.75,
  });
  const [loading, setLoading] = useState(true);

  // Initialize theme from profile or local preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', profile.theme || 'dark');
  }, [profile.theme]);

  // Load user profile on startup if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
          if (userData.profile) {
            setProfile(userData.profile);
          }
        } catch (err) {
          console.warn('Failed to restore session:', err);
          authService.logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    if (data.user.profile) {
      setProfile(data.user.profile);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    if (data.user.profile) {
      setProfile(data.user.profile);
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updatePreferences = async (newPrefs) => {
    const updated = { ...profile, ...newPrefs };
    setProfile(updated);
    if (authService.isAuthenticated()) {
      try {
        await authService.updateSettings(newPrefs);
      } catch (err) {
        console.warn('Failed to sync settings with backend:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
