import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/Navbar';
import PinLock from './components/PinLock';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CheckinPage from './pages/CheckinPage';
import NewCheckinPage from './pages/NewCheckinPage';
import InsightPage from './pages/InsightPage';
import SchedulePage from './pages/SchedulePage';
import AcademicSchedulePage from './pages/AcademicSchedulePage';
import SettingsPage from './pages/SettingsPage';

function MainLayout() {
  const { user } = useAuth();

  // Jika belum login, paksa ke halaman Login terlebih dahulu
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '8px' }}>
      <Navbar />
      <PinLock />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/checkin/new" element={<NewCheckinPage />} />
          <Route path="/insight" element={<InsightPage />} />
          <Route path="/academic-schedule" element={<AcademicSchedulePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '8px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-glass)',
        marginTop: '8px'
      }}>
        Personal Emotion Calendar &copy; {new Date().getFullYear()} &bull; 100% Private Student Data
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <MainLayout />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
