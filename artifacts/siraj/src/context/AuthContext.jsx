import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('siraj_token');
    const savedUser = localStorage.getItem('siraj_user');

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

  // Login action
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Attempt API call to backend
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

      // Offline mode fallback for hackathon demonstration
      if (email && password) {
        const fallbackUser = {
          id: 'mock-uuid-sara-1234',
          email: email || 'sara@siraj.sa',
          full_name: email === 'sara@siraj.sa' ? 'سارة المطيري' : 'مستخدم تجريبي',
          currency: 'SAR',
        };
        const fallbackToken = 'mock-jwt-token-xyz-987';

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
        message: error.response?.data?.detail || 'فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.' 
      };
    }
  };

  // Logout action
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
