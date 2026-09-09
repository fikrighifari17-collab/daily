import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, updateUserProfile } from '../services/api';

const AuthContext = createContext();

// 12-Hour Inactivity Session Timeout
const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 jam

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_user_info');
      if (!saved) return null;

      // Cek apakah sesi sudah melebihi 12 jam sejak aktivitas terakhir
      const lastActiveStr = localStorage.getItem('daily_last_active_at');
      if (lastActiveStr) {
        const lastActive = Number(lastActiveStr);
        if (!isNaN(lastActive) && Date.now() - lastActive > SESSION_TIMEOUT_MS) {
          // Sesi sudah kedaluwarsa
          logoutUser();
          localStorage.removeItem('daily_last_active_at');
          localStorage.setItem('daily_session_expired_flag', 'true');
          return null;
        }
      }

      // Sesi masih valid, perbarui timestamp
      localStorage.setItem('daily_last_active_at', Date.now().toString());
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [pinCode, setPinCode] = useState('');

  useEffect(() => {
    if (user) {
      localStorage.setItem('daily_user_info', JSON.stringify(user));
    }
  }, [user]);

  // Melacak aktivitas pengguna secara real-time & mendeteksi jika aplikasi tidak dibuka > 12 jam
  useEffect(() => {
    if (!user) return;

    let lastWrite = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      // Batasi penulisan ke localStorage maksimal 1 kali per menit agar performa tetap cepat
      if (now - lastWrite > 60000) {
        lastWrite = now;
        localStorage.setItem('daily_last_active_at', now.toString());
      }
    };

    const checkSessionExpiry = () => {
      const lastActiveStr = localStorage.getItem('daily_last_active_at');
      if (lastActiveStr) {
        const lastActive = Number(lastActiveStr);
        if (!isNaN(lastActive) && Date.now() - lastActive > SESSION_TIMEOUT_MS) {
          logoutUser();
          localStorage.removeItem('daily_last_active_at');
          localStorage.setItem('daily_session_expired_flag', 'true');
          setUser(null);
        }
      }
    };

    // Saat tab dibuka kembali / komputer dinyalakan dari sleep
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
        updateActivity();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleUserInteraction = () => {
      checkSessionExpiry();
      updateActivity();
    };

    activityEvents.forEach(evt => window.addEventListener(evt, handleUserInteraction, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cek berkala tiap 1 menit
    const intervalId = setInterval(checkSessionExpiry, 60000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserInteraction));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [user]);

  const handleLogin = async (username, password) => {
    const res = await loginUser(username, password);
    if (res?.user) {
      localStorage.setItem('daily_last_active_at', Date.now().toString());
      localStorage.removeItem('daily_session_expired_flag');
      setUser(res.user);
    }
    return res;
  };

  const handleRegister = async (username, password, nama, telegramChatId = null) => {
    const res = await registerUser(username, password, nama, telegramChatId);
    if (res?.user) {
      localStorage.setItem('daily_last_active_at', Date.now().toString());
      localStorage.removeItem('daily_session_expired_flag');
      setUser(res.user);
    }
    return res;
  };

  const handleLogout = () => {
    logoutUser();
    localStorage.removeItem('daily_last_active_at');
    localStorage.removeItem('daily_session_expired_flag');
    setUser(null);
  };

  const handleUpdateProfile = async (data) => {
    const res = await updateUserProfile(data);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  };

  const setAppPin = (pin) => {
    if (pin && pin.length === 4) {
      setPinCode(pin);
      localStorage.setItem('daily_pin_code', pin);
      setIsPinLocked(true);
      return true;
    } else if (!pin) {
      setPinCode('');
      localStorage.removeItem('daily_pin_code');
      setIsPinLocked(false);
      return true;
    }
    return false;
  };

  const unlockApp = (pin) => {
    if (pin === pinCode) {
      setIsPinLocked(false);
      return true;
    }
    return false;
  };

  const lockAppNow = () => {
    if (pinCode) {
      setIsPinLocked(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        handleLogin,
        handleRegister,
        handleLogout,
        handleUpdateProfile,
        pinCode,
        isPinLocked,
        setAppPin,
        unlockApp,
        lockAppNow
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
