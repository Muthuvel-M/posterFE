import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auraframe_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('auraframe_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      const t = localStorage.getItem('auraframe_token');
      return t && t !== 'undefined' ? t : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.getMe();
          if (mounted && res?.user) {
            setUser(res.user);
            localStorage.setItem('auraframe_user', JSON.stringify(res.user));
          }
        } catch (err) {
          // If explicitly 401 unauthorized, logout. Otherwise preserve offline session.
          if (err.message && err.message.toLowerCase().includes('unauthorized')) {
            if (mounted) logout();
          }
        }
      }
    };

    verifyUser();

    const handleLogout = () => logout();
    window.addEventListener('auth_logout', handleLogout);
    return () => {
      mounted = false;
      window.removeEventListener('auth_logout', handleLogout);
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('auraframe_token', res.token);
      localStorage.setItem('auraframe_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await api.register({ name, email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('auraframe_token', res.token);
      localStorage.setItem('auraframe_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const googleLogin = async (credentialOrPayload) => {
    const payload = typeof credentialOrPayload === 'string'
      ? { credential: credentialOrPayload }
      : credentialOrPayload;

    const res = await api.googleLogin(payload);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('auraframe_token', res.token);
      localStorage.setItem('auraframe_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error(res.message || 'Google authentication failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auraframe_token');
    localStorage.removeItem('auraframe_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
