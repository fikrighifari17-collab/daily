import React, { useState } from 'react';
import { Sparkles, Lock, User, LogIn, UserPlus, ShieldCheck, HeartPulse, BookOpen, Brain, Activity, CheckCircle, Flame, Clock, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { handleLogin, handleRegister } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
          toast.success(`Selamat datang kembali, ${res.user.nama || res.user.username}!`);
        } else {
          setErrorMsg('Username atau password salah.');
        }
      } else {
        if (!username.trim() || !password.trim()) {
          setErrorMsg('Username dan password wajib diisi.');
          setLoading(false);
          return;
        }
        const res = await handleRegister(username, password, nama || username);
        if (res?.user) {
          toast.success(`Akun berhasil dibuat! Selamat datang, ${res.user.nama || res.user.username}!`);
        } else {
          setErrorMsg('Pendaftaran gagal. Silakan coba username lain.');
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
      background: 'radial-gradient(circle at 20% 30%, rgba(0, 173, 181, 0.18), rgba(34, 40, 49, 1) 75%)',
      padding: '24px 16px'
    }}>
      {/* Split Screen Container */}
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '1080px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        background: 'linear-gradient(135deg, rgba(34, 40, 49, 0.96), rgba(57, 62, 70, 0.92))',
        border: '1px solid rgba(0, 173, 181, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 173, 181, 0.2)',
        borderRadius: '0px',
        overflow: 'hidden'
      }}>
        
        {/* ================= SEBELAH KIRI: FORM LOGIN / REGISTER ================= */}
        <div style={{
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRight: '1px solid rgba(0, 173, 181, 0.2)',
          background: 'rgba(34, 40, 49, 0.85)'
        }}>
          {/* Logo & Title */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              borderRadius: '0px',
              background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.3), rgba(0, 255, 245, 0.15))',
              border: '1px solid rgba(0, 173, 181, 0.5)',
              marginBottom: '12px',
              boxShadow: '0 8px 20px rgba(0, 173, 181, 0.3)'
            }}>
              <HeartPulse size={26} color="#00FFF5" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#EEEEEE', margin: '0 0 4px 0' }}>
              Daily <span className="text-gradient-teal">Emotion Tracker</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#b0b8c1', margin: 0 }}>
              {mode === 'login'
                ? 'Masuk menggunakan username dan password Anda'
                : 'Buat akun baru untuk mulai melacak emosi harian'}
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
            border: '1px solid rgba(0, 173, 181, 0.25)'
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={15} />
              Masuk (Sign In)
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={15} />
              Daftar (Register)
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
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="e.g. Fikri Ghifari"
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
                      borderRadius: '0px'
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
                  placeholder="Masukkan username Anda"
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
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(34, 40, 49, 0.9)',
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
                marginTop: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '0px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0, 173, 181, 0.2)', fontSize: '11px', color: '#b0b8c1', textAlign: 'center' }}>
            🔒 100% Data Privat &bull; Tanpa Email/Gmail &bull; Disimpan di Supabase
          </div>
        </div>

        {/* ================= SEBELAH KANAN: TULISAN & INFORMASI MENARIK ================= */}
        <div style={{
          padding: '40px 36px',
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
              padding: '4px 10px',
              borderRadius: '0px',
              background: 'rgba(0, 173, 181, 0.2)',
              border: '1px solid rgba(0, 173, 181, 0.4)',
              marginBottom: '16px'
            }}>
              <Sparkles size={13} color="#00FFF5" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#00FFF5', letterSpacing: '0.04em' }}>
                STUDENT MENTAL HEALTH & WELLBEING
              </span>
            </div>

            {/* Main Headline */}
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#EEEEEE', lineHeight: 1.3, marginBottom: '14px' }}>
              Pahami Emosimu, <br />
              <span className="text-gradient-teal">Kuasai Jadwal Akademikmu.</span>
            </h2>

            <p style={{ fontSize: '13px', color: '#b0b8c1', lineHeight: 1.6, marginBottom: '24px' }}>
              Ruang pribadi untuk mahasiswa mencatat suasana hati harian, mengkorelasikannya dengan beban tugas dan ujian, serta menjaga ketenangan pikiran sepanjang semester.
            </p>

            {/* Feature Highlights Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.6)',
                border: '1px solid rgba(0, 173, 181, 0.2)'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
                  <Activity size={18} color="#00FFF5" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', marginBottom: '2px' }}>
                    Korelasi Jadwal & Emosi
                  </div>
                  <div style={{ fontSize: '11px', color: '#b0b8c1', lineHeight: 1.4 }}>
                    Ketahui kapan stres tertinggi Anda terjadi berdasarkan kalender UTS, UAS, dan praktikum kuliah.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.6)',
                border: '1px solid rgba(0, 173, 181, 0.2)'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
                  <Brain size={18} color="#00FFF5" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', marginBottom: '2px' }}>
                    Brain Dump & Coping Library
                  </div>
                  <div style={{ fontSize: '11px', color: '#b0b8c1', lineHeight: 1.4 }}>
                    Tumpahkan beban pikiran tanpa filter dan akses teknik relaksasi 4-7-8 untuk menenangkan diri saat penat.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: 'rgba(34, 40, 49, 0.6)',
                border: '1px solid rgba(0, 173, 181, 0.2)'
              }}>
                <div style={{ padding: '8px', background: 'rgba(0, 173, 181, 0.2)', border: '1px solid rgba(0, 173, 181, 0.4)' }}>
                  <ShieldCheck size={18} color="#00FFF5" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#EEEEEE', marginBottom: '2px' }}>
                    100% Privat & Aman
                  </div>
                  <div style={{ fontSize: '11px', color: '#b0b8c1', lineHeight: 1.4 }}>
                    Hanya Anda yang memiliki akses. Tanpa pelaporan ke pihak kampus atau pihak ketiga mana pun.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspirational Quote at Bottom */}
          <div style={{
            marginTop: '24px',
            padding: '14px 16px',
            background: 'rgba(0, 173, 181, 0.08)',
            borderLeft: '3px solid #00ADB5'
          }}>
            <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#EEEEEE', margin: 0, lineHeight: 1.5 }}>
              "Mengenali emosi bukan tanda kelemahan, melainkan langkah paling cerdas untuk tetap fokus dan menyelesaikan setiap semester dengan bahagia."
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
