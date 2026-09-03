import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_user_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [isPinLocked, setIsPinLocked] = useState(() => {
    const savedPin = localStorage.getItem('daily_pin_code');
    return Boolean(savedPin);
  });
  const [pinCode, setPinCode] = useState(() => {
    return localStorage.getItem('daily_pin_code') || '';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('daily_user_info', JSON.stringify(user));
    }
  }, [user]);

  const handleLogin = async (username, password) => {
    const res = await loginUser(username, password);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  };

  const handleRegister = async (username, password, nama) => {
    const res = await registerUser(username, password, nama);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
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
