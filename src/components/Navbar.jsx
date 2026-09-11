import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
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
  ChevronRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import SemestaraLogo from './SemestaraLogo';

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
              <SemestaraLogo size={22} idPrefix="nav" />
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
                className="navbar-mobile-user-badge"
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'rgba(0, 173, 181, 0.15)',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(0, 173, 181, 0.35)',
                  color: isActive ? '#ffffff' : '#00FFF5',
                  boxShadow: isActive ? '0 4px 12px rgba(0, 173, 181, 0.4)' : 'none'
                })}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '5px',
                  background: 'rgba(0, 173, 181, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {user.avatar ? (
                    user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '13px', lineHeight: 1 }}>{user.avatar}</span>
                    )
                  ) : (
                    <User size={12} />
                  )}
                </div>
                <span className="navbar-mobile-user-name" style={{
                  maxWidth: '75px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {(user.nama || user.username || 'User').split(' ')[0]}
                </span>
              </NavLink>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="navbar-mobile-menu-btn"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isMobileMenuOpen ? 'rgba(0, 173, 181, 0.25)' : 'var(--bg-inner)',
                border: '1.5px solid var(--border-glass)',
                color: isMobileMenuOpen ? 'var(--accent-teal)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isMobileMenuOpen ? '0 0 15px rgba(0, 173, 181, 0.3)' : 'none'
              }}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ================= MOBILE EXPANDABLE MENU DRAWER & BACKDROP ================= */}
        {isMobileMenuOpen && (
          <>
            <div 
              onClick={closeMobileMenu}
              aria-label="Tutup menu"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                zIndex: 105
              }}
            />
            <div 
              className="animate-fade-in nav-mobile-drawer"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                padding: '14px 14px 16px 14px',
                border: '1.5px solid var(--border-glass)',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 25px rgba(0, 173, 181, 0.15)',
                zIndex: 110,
                maxHeight: 'calc(100vh - 85px)',
                overflowY: 'auto'
              }}
            >
            {/* User Greeting & Status Card (Links to Privacy & PIN) */}
            {user && (
              <Link
                to="/settings"
                onClick={closeMobileMenu}
                className="nav-mobile-user-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-inner)',
                  border: '1.5px solid var(--border-glass)',
                  borderRadius: '10px',
                  marginBottom: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(0, 173, 181, 0.18)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-teal)',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {user.avatar ? (
                      user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                        <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '20px' }}>{user.avatar}</span>
                      )
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {user.nama || user.username}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                      <ShieldCheck size={12} />
                      Profil & Pengaturan Akun
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChevronRight size={16} color="var(--accent-teal)" />
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
                    className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 600,
                      background: isActive 
                        ? 'linear-gradient(135deg, #00ADB5, #00888f)' 
                        : 'var(--bg-inner)',
                      border: isActive 
                        ? '1.5px solid var(--accent-cyan)' 
                        : '1.5px solid var(--border-glass)',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                      boxShadow: isActive ? '0 4px 14px rgba(0, 173, 181, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Icon size={17} color={isActive ? '#ffffff' : 'var(--accent-teal)'} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight size={15} opacity={isActive ? 0.9 : 0.6} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Logout / Sign in Button in Mobile Drawer */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
              {user ? (
                <button
                  onClick={() => { closeMobileMenu(); handleLogout(); }}
                  className="nav-mobile-logout-btn"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1.5px solid rgba(239, 68, 68, 0.35)',
                    color: '#ef4444',
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
            </div>
          </div>
        </>
      )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
