import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Start as true so AppLayout shows a loader while we read localStorage.
  // Set to false only once we have finished the initial check.
  const [loading, setLoading] = useState(true);

  // ── Rehydrate from localStorage on first render ──────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('siraj_token');
    const savedUser  = localStorage.getItem('siraj_user');

    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('siraj_token');
        localStorage.removeItem('siraj_user');
      }
    }
    setLoading(false);
  }, []);

  // ── Listen for unauthorized events fired by the API client ───────────────
  // FIX: This replaces window.location.href = '/login' (hard reload).
  // React state update → isAuthenticated becomes false → AppLayout
  // renders <Navigate to="/login" replace /> cleanly inside React Router.
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('siraj_token');
      localStorage.removeItem('siraj_user');
      setToken(null);
      setUser(null);
    };
    window.addEventListener('siraj:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('siraj:unauthorized', handleUnauthorized);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('siraj_token', access_token);
      localStorage.setItem('siraj_user', JSON.stringify(user));
      setToken(access_token);
      setUser(user);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.warn('Backend login failed, using offline fallback.', error);

      // Offline / demo fallback — only when the backend is unreachable
      if (email && password && !error.response) {
        const fallbackUser = {
          id: 'mock-uuid-sara-1234',
          email,
          full_name: email === 'sara@siraj.sa' ? 'سارة المطيري' : 'مستخدم تجريبي',
          currency: 'SAR',
        };
        // Use a clearly invalid prefix so the interceptor can skip logout for it
        const fallbackToken = 'offline_mock-jwt-token-xyz-987';

        localStorage.setItem('siraj_token', fallbackToken);
        localStorage.setItem('siraj_user', JSON.stringify(fallbackUser));
        setToken(fallbackToken);
        setUser(fallbackUser);
        setLoading(false);
        return { success: true, offline: true };
      }

      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.detail || 'فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.',
      };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('siraj_token');
    localStorage.removeItem('siraj_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
