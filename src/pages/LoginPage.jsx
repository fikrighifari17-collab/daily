import React, { useState } from 'react';
import {
  Lock, User, LogIn, UserPlus, ShieldCheck, HeartPulse, Eye, EyeOff, Send,
  Heart, Sparkles, BookOpen, Coffee, Brain, Smile, Moon, Zap, Music, Feather, Sun, GraduationCap, Star, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SemestaraLogo from '../components/SemestaraLogo';

const FLOATING_ICONS = [
  { id: 1, Icon: Heart, top: '12%', left: '16%', size: 48, iconSize: 22, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)', anim: 'floatIcon1', dur: '5.6s', delay: '0s' },
  { id: 2, Icon: Sparkles, top: '16%', left: '72%', size: 54, iconSize: 26, color: '#00FFF5', bg: 'rgba(0, 255, 245, 0.14)', border: 'rgba(0, 255, 245, 0.35)', anim: 'floatIcon2', dur: '6.2s', delay: '0.8s' },
  { id: 3, Icon: BookOpen, top: '28%', left: '26%', size: 50, iconSize: 24, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', anim: 'floatIcon3', dur: '7.1s', delay: '1.4s' },
  { id: 4, Icon: Coffee, top: '25%', left: '84%', size: 46, iconSize: 21, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', anim: 'floatIcon4', dur: '5.8s', delay: '0.3s' },
  { id: 5, Icon: Brain, top: '46%', left: '14%', size: 52, iconSize: 24, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', anim: 'floatIcon1', dur: '6.5s', delay: '2.1s' },
  { id: 6, Icon: Smile, top: '48%', left: '80%', size: 50, iconSize: 24, color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)', anim: 'floatIcon2', dur: '6.8s', delay: '1.1s' },
  { id: 7, Icon: Moon, top: '66%', left: '18%', size: 46, iconSize: 22, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.3)', anim: 'floatIcon3', dur: '5.3s', delay: '1.7s' },
  { id: 8, Icon: Zap, top: '65%', left: '76%', size: 48, iconSize: 22, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.35)', anim: 'floatIcon4', dur: '6.0s', delay: '2.5s' },
  { id: 9, Icon: Music, top: '82%', left: '30%', size: 50, iconSize: 24, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', anim: 'floatIcon1', dur: '7.3s', delay: '0.6s' },
  { id: 10, Icon: Feather, top: '84%', left: '72%', size: 48, iconSize: 22, color: '#00ADB5', bg: 'rgba(0, 173, 181, 0.15)', border: 'rgba(0, 173, 181, 0.35)', anim: 'floatIcon2', dur: '5.9s', delay: '1.9s' },
  { id: 11, Icon: Sun, top: '10%', left: '46%', size: 44, iconSize: 20, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', anim: 'floatIcon3', dur: '6.4s', delay: '2.8s' },
  { id: 12, Icon: GraduationCap, top: '38%', left: '60%', size: 50, iconSize: 24, color: '#00FFF5', bg: 'rgba(0, 255, 245, 0.13)', border: 'rgba(0, 255, 245, 0.35)', anim: 'floatIcon4', dur: '6.7s', delay: '1.3s' },
  { id: 13, Icon: Star, top: '60%', left: '42%', size: 42, iconSize: 19, color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', anim: 'floatIcon1', dur: '5.4s', delay: '0.7s' },
  { id: 14, Icon: Compass, top: '78%', left: '52%', size: 46, iconSize: 21, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', anim: 'floatIcon2', dur: '7.4s', delay: '2.3s' }
];

export default function LoginPage() {
  const { handleLogin, handleRegister } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionExpired, setSessionExpired] = useState(() => {
    return localStorage.getItem('daily_session_expired_flag') === 'true';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    localStorage.removeItem('daily_session_expired_flag');
    setSessionExpired(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await handleLogin(username, password);
        if (res?.user) {
          toast.success(`Welcome back, ${res.user.nama || res.user.username}!`);
        } else {
          setErrorMsg('Invalid username or password.');
        }
      } else {
        if (!username.trim() || !password.trim()) {
          setErrorMsg('Username and password are required.');
          setLoading(false);
          return;
        }
        const res = await handleRegister(username, password, nama || username, telegramChatId);
        if (res?.user) {
          toast.success(`Account created! Welcome, ${res.user.nama || res.user.username}!`);
        } else {
          setErrorMsg('Registration failed. Please try a different username.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-fixed">
      {/* Split Screen Container (stretched mentok edge-to-edge with 8px margin and 8px border-radius) */}
      <div className="glass-panel animate-fade-in login-split-container" style={{
        background: 'linear-gradient(135deg, rgba(34, 40, 49, 0.96), rgba(57, 62, 70, 0.92))',
        border: '1px solid rgba(0, 173, 181, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 173, 181, 0.2)',
        borderRadius: '8px'
      }}>
        
        {/* ================= LEFT COLUMN: LOGIN / REGISTER FORM ================= */}
        <div className="login-left-column" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(34, 40, 49, 0.85)',
          width: '100%',
          height: '100%'
        }}>
          <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
            {/* Logo & Title */}
          <div style={{ marginBottom: mode === 'register' ? '14px' : '22px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: mode === 'register' ? '38px' : '44px',
              height: mode === 'register' ? '38px' : '44px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.3), rgba(0, 255, 245, 0.15))',
              border: '1px solid rgba(0, 173, 181, 0.5)',
              marginBottom: mode === 'register' ? '6px' : '10px',
              boxShadow: '0 8px 20px rgba(0, 173, 181, 0.3)'
            }}>
              <SemestaraLogo size={mode === 'register' ? 24 : 28} idPrefix="login-head" />
            </div>
            <h1 style={{ fontSize: mode === 'register' ? '22px' : '26px', fontWeight: 800, color: '#EEEEEE', margin: '0 0 3px 0', letterSpacing: '-0.02em' }}>
              Semest<span className="text-gradient-teal">ara</span>
            </h1>
            <p style={{ fontSize: mode === 'register' ? '12px' : '13px', color: '#b0b8c1', margin: 0, lineHeight: 1.4 }}>
              {mode === 'login'
                ? 'Yuk masuk, seimbangin mood sama ritme kuliahmu'
                : 'Bikin akun yuk, biar bisa pantau kabar hatimu tiap hari'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '3px',
            marginBottom: mode === 'register' ? '12px' : '18px',
            border: '1px solid rgba(0, 173, 181, 0.25)',
            borderRadius: '8px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              style={{
                padding: mode === 'register' ? '8px 12px' : '9px 12px',
                fontSize: '12.5px',
                fontWeight: mode === 'login' ? 700 : 500,
                background: mode === 'login' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
                color: mode === 'login' ? '#ffffff' : '#b0b8c1',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn size={14} />
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              style={{
                padding: mode === 'register' ? '8px 12px' : '9px 12px',
                fontSize: '12.5px',
                fontWeight: mode === 'register' ? 700 : 500,
                background: mode === 'register' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
                color: mode === 'register' ? '#ffffff' : '#b0b8c1',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={14} />
              Bikin Akun
            </button>
          </div>

          {/* Session Expired Banner */}
          {sessionExpired && !errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 173, 181, 0.12)',
              border: '1px solid rgba(0, 255, 245, 0.4)',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '11px',
              color: '#00FFF5',
              marginBottom: '10px',
              lineHeight: 1.4
            }}>
              <ShieldCheck size={15} style={{ flexShrink: 0 }} />
              <span>Sesi login kamu telah berakhir karena tidak dibuka lebih dari 12 jam. Silakan masuk kembali.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              color: '#f87171',
              marginBottom: '10px'
            }}>
              <ShieldCheck size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: mode === 'register' ? '10px' : '14px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '4px' }}>
                  Nama Lengkap (Bebas / Opsional)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="misal: Anonim"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      background: 'rgba(34, 40, 49, 0.9)',
                      border: '1px solid rgba(0, 173, 181, 0.3)',
                      color: '#EEEEEE',
                      fontSize: '12.5px',
                      outline: 'none',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: mode === 'register' ? '11px' : '12px', fontWeight: 600, color: '#b0b8c1', marginBottom: '4px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="Ketik username kamu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  data-lpignore="true"
                  style={{
                    width: '100%',
                    padding: mode === 'register' ? '8px 12px 8px 36px' : '10px 14px 10px 38px',
                    background: 'rgba(34, 40, 49, 0.9)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: mode === 'register' ? '12.5px' : '13px',
                    outline: 'none',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: mode === 'register' ? '11px' : '12px', fontWeight: 600, color: '#b0b8c1', marginBottom: '4px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ketik password kamu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'off'}
                  data-lpignore="true"
                  style={{
                    width: '100%',
                    padding: mode === 'register' ? '8px 40px 8px 36px' : '10px 42px 10px 38px',
                    background: 'rgba(34, 40, 49, 0.9)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: mode === 'register' ? '12.5px' : '13px',
                    outline: 'none',
                    borderRadius: '8px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showPassword ? '#00FFF5' : '#b0b8c1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    transition: 'color 0.2s ease'
                  }}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#b0b8c1' }}>
                    Telegram Chat ID <span style={{ color: '#00FFF5', fontWeight: 400 }}>(Opsional)</span>
                  </label>
                  <a
                    href="https://t.me/Semestara_Bot"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '10.5px', color: '#00FFF5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    Buka @Semestara_Bot ↗
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Send size={15} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Contoh: 123456789 (untuk notifikasi deadline)"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      background: 'rgba(34, 40, 49, 0.9)',
                      border: '1px solid rgba(0, 173, 181, 0.3)',
                      color: '#EEEEEE',
                      fontSize: '12.5px',
                      outline: 'none',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: '#8892b0', marginTop: '2px', display: 'block' }}>
                  Bisa diisi nanti kapan saja di menu Pengaturan.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-button glass-button-primary"
              style={{
                marginTop: mode === 'register' ? '6px' : '10px',
                padding: mode === 'register' ? '10px' : '12px',
                fontSize: mode === 'register' ? '13px' : '14px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '8px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Bentar ya...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          {/* Footer message placed right under form */}
          <div style={{
            marginTop: mode === 'register' ? '14px' : '22px',
            paddingTop: mode === 'register' ? '10px' : '16px',
            borderTop: '1px solid rgba(0, 173, 181, 0.15)',
            fontSize: '11px',
            color: '#7a848f',
            textAlign: 'center',
            letterSpacing: '0.02em'
          }}>
            I hope this makes things a little easier for you.
          </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: FLOATING ICONS ANIMATION (NO WORDS) ================= */}
        <div className="login-right-column" style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 173, 181, 0.16) 0%, rgba(34, 40, 49, 0.95) 75%)',
          padding: '28px',
          minHeight: '480px'
        }}>
          {/* Ambient Glowing Orbs */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 245, 0.22) 0%, rgba(0, 173, 181, 0.05) 60%, transparent 80%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Central Pulsing Heart Emblem */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Concentric Pulsing Light Rings */}
            <div style={{
              position: 'absolute',
              width: '190px',
              height: '190px',
              borderRadius: '50%',
              border: '1px solid rgba(0, 255, 245, 0.25)',
              animation: 'pulseGlowRing 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              width: '270px',
              height: '270px',
              borderRadius: '50%',
              border: '1px dashed rgba(0, 173, 181, 0.2)',
              animation: 'pulseGlowRing 6s ease-in-out infinite reverse',
              pointerEvents: 'none'
            }} />

            {/* Glowing Center Badge */}
            <div style={{
              width: '92px',
              height: '92px',
              borderRadius: '26px',
              background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.35), rgba(0, 255, 245, 0.18))',
              border: '1.5px solid rgba(0, 255, 245, 0.45)',
              boxShadow: '0 0 45px rgba(0, 173, 181, 0.45), inset 0 0 25px rgba(0, 255, 245, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              animation: 'floatIcon1 6s ease-in-out infinite'
            }}>
              <SemestaraLogo size={52} idPrefix="login-center" />
            </div>
          </div>

          {/* Floating Random Icons */}
          {FLOATING_ICONS.map(({ id, Icon, top, left, size, iconSize, color, bg, border, anim, dur, delay }) => (
            <div
              key={id}
              className="floating-icon-badge"
              style={{
                top,
                left,
                width: `${size}px`,
                height: `${size}px`,
                background: bg,
                borderColor: border,
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px ${color}33`,
                animation: `${anim} ${dur} ease-in-out infinite`,
                animationDelay: delay,
                zIndex: 1
              }}
            >
              <Icon size={iconSize} color={color} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
