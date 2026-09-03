import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, ShieldCheck, HeartPulse, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { handleLogin, handleRegister } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await handleLogin(email, password);
        if (res?.user) {
          toast.success(`Selamat datang kembali, ${res.user.nama}!`);
        } else {
          setErrorMsg('Email atau password tidak sesuai.');
        }
      } else {
        if (!nama.trim()) {
          setErrorMsg('Mohon masukkan nama lengkap Anda.');
          setLoading(false);
          return;
        }
        const res = await handleRegister(nama, email, password);
        if (res?.user) {
          toast.success(`Akun berhasil dibuat! Selamat datang, ${res.user.nama}!`);
        } else {
          setErrorMsg('Pendaftaran gagal. Silakan coba lagi.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan autentikasi. Pastikan koneksi internet aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, rgba(0, 173, 181, 0.15), rgba(34, 40, 49, 1) 75%)',
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '460px',
        background: 'linear-gradient(135deg, rgba(34, 40, 49, 0.95), rgba(57, 62, 70, 0.95))',
        border: '1px solid rgba(0, 173, 181, 0.4)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 173, 181, 0.25)',
        borderRadius: '0px',
        padding: '32px 28px',
        position: 'relative'
      }}>
        {/* App Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '0px',
            background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.3), rgba(0, 255, 245, 0.15))',
            border: '1px solid rgba(0, 173, 181, 0.5)',
            marginBottom: '14px',
            boxShadow: '0 8px 20px rgba(0, 173, 181, 0.3)'
          }}>
            <HeartPulse size={30} color="#00FFF5" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#EEEEEE', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Daily <span className="text-gradient-teal">Emotion Tracker</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#b0b8c1', margin: 0, lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Masuk untuk mengakses kalender emosi & jadwal akademik Anda'
              : 'Daftar akun baru untuk mulai mencatat emosi harian secara privat'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid rgba(0, 173, 181, 0.25)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: mode === 'login' ? 700 : 500,
              background: mode === 'login' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#b0b8c1',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} />
            Masuk (Sign In)
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: mode === 'register' ? 700 : 500,
              background: mode === 'register' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : '#b0b8c1',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} />
            Daftar (Register)
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#f87171',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Nama Lengkap
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Fikri Ghifari"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(34, 40, 49, 0.8)',
                    border: '1px solid rgba(0, 173, 181, 0.3)',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    borderRadius: '0px'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
              Alamat Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  background: 'rgba(34, 40, 49, 0.8)',
                  border: '1px solid rgba(0, 173, 181, 0.3)',
                  color: '#EEEEEE',
                  fontSize: '13px',
                  outline: 'none',
                  borderRadius: '0px'
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
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  background: 'rgba(34, 40, 49, 0.8)',
                  border: '1px solid rgba(0, 173, 181, 0.3)',
                  color: '#EEEEEE',
                  fontSize: '13px',
                  outline: 'none',
                  borderRadius: '0px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button glass-button-primary"
            style={{
              marginTop: '10px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 700,
              justifyContent: 'center',
              borderRadius: '0px',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.02em'
            }}
          >
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Saya'}
          </button>
        </form>

        {/* Privacy & Security Features */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(0, 173, 181, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#b0b8c1' }}>
            <ShieldCheck size={14} color="#00ADB5" />
            <span>100% Data Privat milik Anda, tidak dilaporkan ke pihak manapun.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#b0b8c1' }}>
            <BookOpen size={14} color="#00FFF5" />
            <span>Korelasikan jadwal kuliah & ujian dengan pola stres Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
