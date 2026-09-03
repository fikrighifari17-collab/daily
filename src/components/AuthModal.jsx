import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, LogIn, UserPlus, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthModal({ isOpen, onClose }) {
  const { handleLogin, handleRegister } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await handleLogin(username, password);
        if (res?.user) {
          toast.success(`Welcome back, ${res.user.nama || res.user.username}!`);
          onClose();
        } else {
          setErrorMsg('Invalid username or password.');
        }
      } else {
        if (!username.trim() || !password.trim()) {
          setErrorMsg('Username and password are required.');
          setLoading(false);
          return;
        }
        const res = await handleRegister(username, password, nama || username);
        if (res?.user) {
          toast.success(`Account created! Welcome, ${res.user.nama || res.user.username}!`);
          onClose();
        } else {
          setErrorMsg('Registration failed. Please choose another username.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'linear-gradient(135deg, rgba(34, 40, 49, 0.95), rgba(57, 62, 70, 0.95))',
        border: '1px solid rgba(0, 173, 181, 0.4)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 173, 181, 0.2)',
        borderRadius: '8px',
        padding: '24px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#b0b8c1',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: 'rgba(0, 173, 181, 0.2)',
            border: '1px solid rgba(0, 173, 181, 0.4)',
            marginBottom: '10px'
          }}>
            <Sparkles size={24} color="#00FFF5" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', margin: '0 0 4px 0' }}>
            {mode === 'login' ? 'Sign In to Your Account' : 'Create an Account'}
          </h3>
          <p style={{ fontSize: '12px', color: '#b0b8c1', margin: 0 }}>
            {mode === 'login' ? 'Enter your username and password' : 'Register to start tracking your daily mood privately'}
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
          border: '1px solid rgba(0, 173, 181, 0.2)',
          borderRadius: '8px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: mode === 'login' ? 700 : 500,
              background: mode === 'login' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#b0b8c1',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={14} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: mode === 'register' ? 700 : 500,
              background: mode === 'register' ? 'linear-gradient(135deg, #00ADB5, #00888f)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : '#b0b8c1',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={14} />
            Register
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
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#f87171',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0b8c1', marginBottom: '6px' }}>
                Full Name (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#00ADB5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(34, 40, 49, 0.8)',
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
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(34, 40, 49, 0.8)',
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 38px',
                  background: 'rgba(34, 40, 49, 0.8)',
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
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
              borderRadius: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In Now' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#b0b8c1', marginTop: '16px', marginBottom: 0 }}>
          🔒 100% Private Student Data &bull; No Email Required
        </p>
      </div>
    </div>,
    document.body
  );
}
