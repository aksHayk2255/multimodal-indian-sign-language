import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';

// Pages
import Landing from './pages/Landing/Landing';
import Dashboard from './pages/Dashboard/Dashboard';
import SignLanguage from './pages/SignLanguage/SignLanguage';
import Speech from './pages/Speech/Speech';
import Conversation from './pages/Conversation/Conversation';
import History from './pages/History/History';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <div className="page-container">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sign-language" element={<SignLanguage />} />
                <Route path="/speech" element={<Speech />} />
                <Route path="/conversation" element={<Conversation />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
