import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((text, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, text, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration = 3000) => showToast(msg, 'success', duration),
    error: (msg, duration = 3000) => showToast(msg, 'error', duration),
    info: (msg, duration = 3000) => showToast(msg, 'info', duration),
    warning: (msg, duration = 3000) => showToast(msg, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      
      {/* Floating Toast Notification Container */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}>
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const accentColor = isSuccess ? '#00FFF5' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#00ADB5';
          const bgColor = isSuccess ? 'rgba(0, 173, 181, 0.25)' : isError ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 40, 49, 0.9)';
          const borderColor = isSuccess ? 'rgba(0, 255, 245, 0.5)' : isError ? 'rgba(239, 68, 68, 0.5)' : isWarning ? 'rgba(245, 158, 11, 0.5)' : 'rgba(0, 173, 181, 0.4)';

          return (
            <div
              key={t.id}
              className="toast-floating"
              style={{
                pointerEvents: 'auto',
                background: bgColor,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${borderColor}`,
                borderLeft: `4px solid ${accentColor}`,
                color: '#EEEEEE',
                padding: '14px 16px',
                borderRadius: '0px',
                boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${accentColor}33`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ marginTop: '2px', color: accentColor, flexShrink: 0 }}>
                {isSuccess ? <CheckCircle2 size={18} /> : isError ? <AlertCircle size={18} /> : <Info size={18} />}
              </div>

              <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, lineHeight: 1.4, color: '#EEEEEE' }}>
                {t.text}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <X size={15} />
              </button>

              {/* 3-Second Floating Progress Bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${accentColor}, #00FFF5)`,
                width: '100%',
                animation: `toastProgress ${t.duration || 3000}ms linear forwards`
              }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
