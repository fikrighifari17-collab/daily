import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  Lock, 
  PlusCircle, 
  History, 
  BookOpen, 
  User, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  HeartPulse,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, handleLogout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMobileMenuOpen]);

  // Main navigation items (Privacy & PIN is now accessible by clicking the user profile chip)
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/checkin/new', label: 'Catat Mood', icon: PlusCircle },
    { to: '/checkin', label: 'Riwayat Mood', icon: History, end: true },
    { to: '/insight', label: 'Analisis Mood', icon: BarChart3 },
    { to: '/academic-schedule', label: 'Jadwal Kuliah', icon: BookOpen },
    { to: '/schedule', label: 'Tugas & Deadline', icon: Calendar }
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="glass-panel" style={{
        position: 'sticky',
        top: '8px',
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 173, 181, 0.3)',
        background: 'rgba(34, 40, 49, 0.94)',
        marginBottom: '8px',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '100%',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Brand Logo */}
          <Link 
            to="/" 
            onClick={closeMobileMenu}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              textDecoration: 'none',
              flexShrink: 0 
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.35), rgba(0, 255, 245, 0.2))',
              border: '1px solid rgba(0, 173, 181, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 173, 181, 0.3)'
            }}>
              <HeartPulse size={18} color="#00FFF5" />
            </div>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 800, 
              color: '#EEEEEE',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              Semest<span className="text-gradient-teal">ara</span>
            </span>
          </Link>

          {/* ================= DESKTOP NAVIGATION BUBBLE PILL ================= */}
          <nav className="nav-desktop" style={{
            gap: '4px',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(57, 62, 70, 0.55)',
            padding: '4px 6px',
            borderRadius: '8px',
            border: '1px solid rgba(0, 173, 181, 0.25)',
            flexShrink: 0
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `glass-button ${isActive ? 'glass-button-primary' : ''}`}
                  style={({ isActive }) => ({
                    fontSize: '12px',
                    padding: '6px 11px',
                    borderRadius: '8px',
                    background: isActive ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                    boxShadow: isActive ? '0 4px 12px rgba(0, 173, 181, 0.4)' : 'none',
                    color: isActive ? '#ffffff' : '#b0b8c1',
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  })}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* ================= DESKTOP RIGHT ACTIONS ================= */}
          <div className="nav-desktop" style={{ alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Clicking user chip navigates to Privacy & PIN settings */}
                <NavLink
                  to="/settings"
                  title="Klik untuk buka Pengaturan PIN & Privasi"
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: isActive ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'rgba(0, 173, 181, 0.15)',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(0, 173, 181, 0.35)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isActive ? '#ffffff' : '#00FFF5',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(0, 173, 181, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  })}
                >
                  {user.avatar ? (
                    user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '14px', lineHeight: 1 }}>{user.avatar}</span>
                    )
                  ) : (
                    <User size={13} />
                  )}
                  <span>{user.nama || user.username}</span>
                  <ShieldCheck size={12} opacity={0.75} />
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="glass-button"
                  style={{
                    fontSize: '12px',
                    padding: '6px 10px',
                    color: '#f87171',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.08)'
                  }}
                  title="Keluar dari akun ini"
                >
                  <LogOut size={13} />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="glass-button glass-button-primary"
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
              >
                <LogIn size={14} />
                <span>Masuk</span>
              </button>
            )}
          </div>

          {/* ================= MOBILE RIGHT CONTROLS ================= */}
          <div className="nav-mobile-toggle" style={{ alignItems: 'center', gap: '8px' }}>
            {user && (
              <NavLink
                to="/settings"
                onClick={closeMobileMenu}
                title="Pengaturan PIN & Privasi"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  background: isActive ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'rgba(0, 173, 181, 0.15)',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(0, 173, 181, 0.35)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: isActive ? '#ffffff' : '#00FFF5',
                  fontWeight: 700,
                  maxWidth: '130px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 173, 181, 0.4)' : 'none'
                })}
              >
                {user.avatar ? (
                  user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                    <img src={user.avatar} alt="Avatar" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>{user.avatar}</span>
                  )
                ) : (
                  <User size={13} />
                )}
                <span>{user.nama || user.username}</span>
                <ShieldCheck size={11} opacity={0.7} />
              </NavLink>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isMobileMenuOpen ? 'rgba(0, 173, 181, 0.3)' : 'rgba(57, 62, 70, 0.7)',
                border: '1px solid rgba(0, 173, 181, 0.4)',
                color: isMobileMenuOpen ? '#00FFF5' : '#EEEEEE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isMobileMenuOpen ? '0 0 15px rgba(0, 173, 181, 0.4)' : 'none'
              }}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ================= MOBILE EXPANDABLE MENU DRAWER (FLOATING OVERLAY) ================= */}
        {isMobileMenuOpen && (
          <div 
            className="animate-fade-in nav-mobile-drawer"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              padding: '12px 14px 16px 14px',
              border: '1px solid rgba(0, 173, 181, 0.4)',
              background: 'rgba(34, 40, 49, 0.98)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              borderRadius: '8px',
              boxShadow: '0 16px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 173, 181, 0.25)',
              zIndex: 100,
              maxHeight: 'calc(100vh - 85px)',
              overflowY: 'auto'
            }}
          >
            {/* User Greeting & Status Card (Links to Privacy & PIN) */}
            {user && (
              <Link
                to="/settings"
                onClick={closeMobileMenu}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(57, 62, 70, 0.55)',
                  border: '1px solid rgba(0, 173, 181, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(0, 173, 181, 0.25)',
                    border: '1px solid rgba(0, 173, 181, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00FFF5',
                    overflow: 'hidden'
                  }}>
                    {user.avatar ? (
                      user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                        <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '20px' }}>{user.avatar}</span>
                      )
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                      {user.nama || user.username}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00FFF5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={11} />
                      Profil & Pengaturan Akun
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChevronRight size={16} color="#00ADB5" />
                </div>
              </Link>
            )}

            {/* Nav Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={closeMobileMenu}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(0, 173, 181, 0.85), rgba(0, 136, 143, 0.85))' 
                        : 'rgba(57, 62, 70, 0.4)',
                      border: isActive 
                        ? '1px solid rgba(0, 255, 245, 0.5)' 
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#ffffff' : '#EEEEEE',
                      boxShadow: isActive ? '0 4px 14px rgba(0, 173, 181, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={17} color="#00FFF5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={15} opacity={0.6} />
                  </NavLink>
                );
              })}
            </div>

            {/* Logout / Sign in Button in Mobile Drawer */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0, 173, 181, 0.2)' }}>
              {user ? (
                <button
                  onClick={() => { closeMobileMenu(); handleLogout(); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LogOut size={15} />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  onClick={() => { closeMobileMenu(); setIsAuthModalOpen(true); }}
                  className="glass-button glass-button-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px', justifyContent: 'center' }}
                >
                  <LogIn size={15} />
                  <span>Masuk / Daftar</span>
                </button>
              )}

              {/* Tombol Tutup Menu / Kembali ke Atas */}
              <button
                type="button"
                onClick={closeMobileMenu}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(0, 173, 181, 0.15)',
                  border: '1px solid rgba(0, 173, 181, 0.4)',
                  color: '#00FFF5',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 173, 181, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronUp size={16} />
                <span>Tutup Menu / Kembali ke Atas</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Full-screen Backdrop rendered at document.body level so clicking anywhere outside closes the menu */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={closeMobileMenu}
          aria-label="Tutup menu"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 99
          }}
        />,
        document.body
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
