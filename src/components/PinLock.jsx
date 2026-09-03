import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PinLock() {
  const { isPinLocked, unlockApp } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isPinLocked) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        const success = unlockApp(nextPin);
        if (!success) {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div className="glass-panel" style={{ maxWidth: '380px', width: '100%', padding: '36px', textAlign: 'center', borderRadius: '0px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '0px',
          background: 'linear-gradient(135deg, #00ADB5, #00FFF5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 0 25px rgba(0, 173, 181, 0.4)'
        }}>
          <Lock size={28} color="#222831" />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#EEEEEE', marginBottom: '6px' }}>
          Application Locked
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Enter your 4-digit personal security PIN to access emotion data.
        </p>

        {/* PIN Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '0px',
                  background: filled ? '#00FFF5' : 'transparent',
                  border: `2px solid ${error ? '#ef4444' : filled ? '#00FFF5' : 'var(--border-glass)'}`,
                  transition: 'all 0.2s ease',
                  boxShadow: filled ? '0 0 10px rgba(0, 255, 245, 0.6)' : 'none'
                }}
              />
            );
          })}
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={15} />
            Incorrect PIN! Please try again.
          </div>
        )}

        {/* Numpad Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '240px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              className="glass-button"
              style={{
                height: '52px',
                fontSize: '18px',
                fontWeight: 700,
                justifyContent: 'center',
                borderRadius: '0px'
              }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="glass-button"
            style={{ height: '52px', fontSize: '12px', justifyContent: 'center', borderRadius: '0px', color: 'var(--text-muted)' }}
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="glass-button"
            style={{ height: '52px', fontSize: '18px', fontWeight: 700, justifyContent: 'center', borderRadius: '0px' }}
          >
            0
          </button>
        </div>
      </div>
    </div>
  );
}
