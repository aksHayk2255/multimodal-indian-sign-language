export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' }
];

export const CORE_ISL_SIGNS = [
  "HELLO",
  "THANK YOU",
  "YES",
  "NO",
  "PLEASE",
  "HELP",
  "GOODBYE",
  "HOW ARE YOU",
  "WELCOME",
  "SORRY",
  "WATER",
  "FOOD",
  "EMERGENCY",
  "NAME",
  "WHERE"
];
