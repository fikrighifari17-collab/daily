import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, handleLogout, pinCode, lockAppNow } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Main navigation items (Privacy & PIN is now accessible by clicking the user profile chip)
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/checkin/new', label: 'Mood Check-in', icon: PlusCircle },
    { to: '/checkin', label: 'Mood History', icon: History, end: true },
    { to: '/insight', label: 'Insights & Analytics', icon: BarChart3 },
    { to: '/academic-schedule', label: 'Academic Schedule', icon: BookOpen },
    { to: '/schedule', label: 'Tasks & Deadlines', icon: Calendar }
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
                  title="Click to open Privacy & PIN Settings"
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
                  <User size={13} />
                  <span>{user.nama || user.username}</span>
                  <ShieldCheck size={12} opacity={0.75} />
                </NavLink>

                {pinCode && (
                  <button
                    onClick={lockAppNow}
                    className="glass-button"
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      fontSize: '12px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)'
                    }}
                    title="Lock application now"
                  >
                    <Lock size={13} />
                    <span>Lock</span>
                  </button>
                )}

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
                  title="Log out from this account"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="glass-button glass-button-primary"
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* ================= MOBILE RIGHT CONTROLS ================= */}
          <div className="nav-mobile-toggle" style={{ alignItems: 'center', gap: '8px' }}>
            {user && (
              <NavLink
                to="/settings"
                onClick={closeMobileMenu}
                title="Privacy & PIN Settings"
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
                <User size={13} />
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

        {/* ================= MOBILE EXPANDABLE MENU DRAWER ================= */}
        {isMobileMenuOpen && (
          <div 
            className="animate-fade-in"
            style={{
              padding: '12px 14px 16px 14px',
              borderTop: '1px solid rgba(0, 173, 181, 0.25)',
              background: 'rgba(34, 40, 49, 0.98)',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(0, 173, 181, 0.25)',
                    border: '1px solid rgba(0, 173, 181, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00FFF5'
                  }}>
                    <User size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE' }}>
                      {user.nama || user.username}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00FFF5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={11} />
                      Privacy & PIN Settings
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {pinCode && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeMobileMenu(); lockAppNow(); }}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Lock size={12} />
                      Lock
                    </button>
                  )}
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
                  <span>Log Out</span>
                </button>
              ) : (
                <button
                  onClick={() => { closeMobileMenu(); setIsAuthModalOpen(true); }}
                  className="glass-button glass-button-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px', justifyContent: 'center' }}
                >
                  <LogIn size={15} />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
