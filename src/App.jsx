import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/Navbar';

// Route Code-Splitting (Lazy Loading) to drastically reduce initial bundle size
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CheckinPage = lazy(() => import('./pages/CheckinPage'));
const NewCheckinPage = lazy(() => import('./pages/NewCheckinPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const AcademicSchedulePage = lazy(() => import('./pages/AcademicSchedulePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageFallback() {
  return (
    <div style={{
      width: '100%',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid rgba(0, 173, 181, 0.2)',
        borderTop: '3px solid #00FFF5',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite'
      }} />
      <span style={{ fontSize: '12px', color: '#b0b8c1', fontWeight: 600 }}>Memuat halaman...</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function MainLayout() {
  const { user } = useAuth();

  // Jika belum login, arahkan ke halaman Login
  if (!user) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main-content">
        <div style={{ flex: 1 }}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/checkin" element={<CheckinPage />} />
              <Route path="/checkin/new" element={<NewCheckinPage />} />
              <Route path="/academic-schedule" element={<AcademicSchedulePage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>

        <footer style={{
          textAlign: 'center',
          padding: '16px 8px 12px 8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-glass)',
          marginTop: '16px'
        }}>
          I hope this makes things a little easier for you.
        </footer>
      </main>
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
