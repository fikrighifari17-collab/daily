import React, { useState } from 'react';
import { Sparkles, Lock, User, LogIn, UserPlus, ShieldCheck, HeartPulse, BookOpen, Brain, Activity, Eye, EyeOff, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
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
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      boxSizing: 'border-box',
      display: 'flex',
      background: 'radial-gradient(circle at 20% 30%, rgba(0, 173, 181, 0.2), rgba(34, 40, 49, 1) 75%)',
      padding: '8px' // Gap 8px mentok atas, bawah, kiri, kanan
    }}>
      {/* Split Screen Container (stretched mentok edge-to-edge with 8px margin and 8px border-radius) */}
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        minHeight: 'calc(100vh - 16px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        background: 'linear-gradient(135deg, rgba(34, 40, 49, 0.96), rgba(57, 62, 70, 0.92))',
        border: '1px solid rgba(0, 173, 181, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 173, 181, 0.2)',
        borderRadius: '8px',
        overflow: 'auto'
      }}>
        
        {/* ================= LEFT COLUMN: LOGIN / REGISTER FORM ================= */}
        <div style={{
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRight: '1px solid rgba(0, 173, 181, 0.2)',
          background: 'rgba(34, 40, 49, 0.85)'
        }}>
          {/* Logo & Title */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.3), rgba(0, 255, 245, 0.15))',
              border: '1px solid rgba(0, 173, 181, 0.5)',
              marginBottom: '12px',
              boxShadow: '0 8px 20px rgba(0, 173, 181, 0.3)'
            }}>
              <HeartPulse size={26} color="#00FFF5" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#EEEEEE', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
              Semest<span className="text-gradient-teal">ara</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#b0b8c1', margin: 0 }}>
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
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(0, 173, 181, 0.25)',
            borderRadius: '8px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              style={{
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: mode === 'login' ? 700 : 500,
                background: mode === 'login' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
                color: mode === 'login' ? '#ffffff' : '#b0b8c1',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn size={15} />
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              style={{
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: mode === 'register' ? 700 : 500,
                background: mode === 'register' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
                color: mode === 'register' ? '#ffffff' : '#b0b8c1',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={15} />
              Bikin Akun
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#f87171',
              marginBottom: '16px'
            }}>
              <ShieldCheck size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                  Nama Lengkap (Bebas / Opsional)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="misal: Fikri Ghifari"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(34, 40, 49, 0.9)',
                      border: '1px solid rgba(0, 173, 181, 0.3)',
                      color: '#EEEEEE',
                      fontSize: '13px',
                      outline: 'none',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="Ketik username kamu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(34, 40, 49, 0.9)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ketik password kamu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 38px',
                    background: 'rgba(34, 40, 49, 0.9)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    borderRadius: '8px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showPassword ? '#00FFF5' : '#b0b8c1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#b0b8c1' }}>
                    Telegram Chat ID <span style={{ color: '#00FFF5', fontWeight: 400 }}>(Opsional)</span>
                  </label>
                  <a
                    href="https://t.me/Semestara_Bot"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#00FFF5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    Buka @Semestara_Bot ↗
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Send size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Contoh: 8025609014 (untuk notifikasi deadline)"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: 'rgba(34, 40, 49, 0.9)',
                      border: '1px solid rgba(0, 173, 181, 0.3)',
                      color: '#EEEEEE',
                      fontSize: '13px',
                      outline: 'none',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: '#8892b0', marginTop: '4px', display: 'block' }}>
                  Bisa diisi nanti kapan saja di menu Pengaturan.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-button glass-button-primary"
              style={{
                marginTop: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '8px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Bentar ya...' : mode === 'login' ? 'Gas Masuk' : 'Bikin Akun Sekarang'}
            </button>
          </form>

          {/* Quick Demo Account 1-Click Login */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0, 173, 181, 0.25)' }} />
              <span style={{ fontSize: '10px', color: '#b0b8c1', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                Akses Demo Cepat
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0, 173, 181, 0.25)' }} />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setMode('login');
                setUsername('demo');
                setPassword('demo123');
                setErrorMsg('');
                setLoading(true);
                try {
                  const res = await handleLogin('demo', 'demo123');
                  if (res?.user) {
                    toast.success(`Halo ${res.user.nama || 'Sobat Semestara'}, selamat datang!`);
                  } else {
                    setErrorMsg('Gagal masuk ke akun demo nih.');
                  }
                } catch (err) {
                  setErrorMsg(err.message || 'Ada kendala pas mau masuk.');
                } finally {
                  setLoading(false);
                }
              }}
              className="glass-button"
              style={{
                padding: '11px',
                fontSize: '13px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(0, 255, 245, 0.14), rgba(0, 173, 181, 0.28))',
                borderColor: 'rgba(0, 255, 245, 0.45)',
                color: '#00FFF5',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 173, 181, 0.15)'
              }}
            >
              <Sparkles size={16} color="#00FFF5" />
              <span>Masuk dengan Akun Demo (1-Click)</span>
            </button>

            <div style={{
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(0, 173, 181, 0.2)',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#b0b8c1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>User: <strong style={{ color: '#00FFF5' }}>demo</strong></span>
              <span>Pass: <strong style={{ color: '#00FFF5' }}>demo123</strong></span>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0, 173, 181, 0.2)', fontSize: '11px', color: '#b0b8c1', textAlign: 'center' }}>
            🔒 100% Privasi Aman &bull; Nggak Butuh Email &bull; Tersimpan Aman
          </div>
        </div>

        {/* ================= RIGHT COLUMN: INFORMATIVE & INSPIRING CONTENT ================= */}
        <div style={{
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.12), rgba(57, 62, 70, 0.7))',
          position: 'relative'
        }}>
          <div>
            {/* Tag Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 173, 181, 0.2)',
              border: '1px solid rgba(0, 173, 181, 0.4)',
              marginBottom: '16px'
            }}>
              <Sparkles size={13} color="#00FFF5" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#00FFF5', letterSpacing: '0.04em' }}>
                🌿 KESEHATAN MENTALMU ITU PENTING
              </span>
            </div>

            {/* Main Headline */}
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#EEEEEE', lineHeight: 1.3, marginBottom: '12px' }}>
              Pahami Isi Hatimu, <br />
              <span className="text-gradient-teal">Taklukin Semester Ini.</span>
            </h2>

            <p style={{ fontSize: '13px', color: '#b0b8c1', lineHeight: 1.6, marginBottom: '22px' }}>
              Tempat aman & privat buat pantau perasaanmu, lihat gimana tugas kuliah ngaruh ke mood, dan bikin pikiran tetap plong sepanjang semester.
            </p>

            {/* Feature Highlights Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.65)',
                border: '1px solid rgba(0, 173, 181, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', borderRadius: '8px' }}>
                  <Activity size={18} color="#00FFF5" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', marginBottom: '2px' }}>
                    Kenali Pola Stres Kamu
                  </div>
                  <div style={{ fontSize: '11px', color: '#b0b8c1', lineHeight: 1.4 }}>
                    Cari tahu kapan rasa capek atau stresmu lagi numpuk—apakah pas musim UTS, UAS, atau pas tugas lagi bejibun.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.65)',
                border: '1px solid rgba(0, 173, 181, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', borderRadius: '8px' }}>
                  <Brain size={18} color="#00FFF5" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', marginBottom: '2px' }}>
                    Ruang Curhat & Latihan Rileks
                  </div>
                  <div style={{ fontSize: '11px', color: '#b0b8c1', lineHeight: 1.4 }}>
                    Keluarin unek-unek yang bikin pusing di sini dengan aman, plus cobain teknik napas 4-7-8 kalau butuh rehat sejenak.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.65)',
                border: '1px solid rgba(0, 173, 181, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)', borderRadius: '8px' }}>
                  <ShieldCheck size={18} color="#00FFF5" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', marginBottom: '2px' }}>
                    100% Aman & Khusus Buat Kamu
                  </div>
                  <div style={{ fontSize: '11px', color: '#b0b8c1', lineHeight: 1.4 }}>
                    Cuma kamu yang bisa lihat. Datamu nggak bakal pernah dibagikan ke pihak kampus atau orang lain. Tempat ini murni punyamu.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspirational Quote at Bottom */}
          <div style={{
            marginTop: '22px',
            padding: '12px 16px',
            background: 'rgba(0, 173, 181, 0.08)',
            borderLeft: '3px solid #00ADB5',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#EEEEEE', margin: 0, lineHeight: 1.5 }}>
              "Jujur sama perasaan sendiri itu bukan tanda lemah—justru cara paling keren biar bisa lewatin tiap semester dengan kepala dingin dan hati tenang."
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
