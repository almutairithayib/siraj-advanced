import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';

export const AlertsContext = createContext(null);

export const alertTypes = {
  budget:           { label: 'تجاوز الميزانية',         color: '#dc2626' },
  budget_breach:    { label: 'تجاوز الميزانية',         color: '#dc2626' },
  spending_spike:   { label: 'ارتفاع مفاجئ بالإنفاق',   color: '#d97706' },
  bill:             { label: 'فاتورة مستحقة',            color: '#2563eb' },
  goal:             { label: 'إنجاز هدف',               color: '#16a34a' },
  goal_milestone:   { label: 'إنجاز هدف',               color: '#16a34a' },
  savings_created:  { label: 'إنشاء حصالة جديدة',       color: '#8b5cf6' },
  savings_deduction:{ label: 'استقطاع ادخاري',          color: '#0ea5e9' },
};

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts]         = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const [loading, setLoading]       = useState(false);

  // FIX: Read isAuthenticated so we only fetch when the user is logged in
  const { isAuthenticated } = useContext(AuthContext);

  const fetchAlerts = async () => {
    // Guard — never fire unauthenticated requests (prevents pre-login 401 race)
    if (!localStorage.getItem('siraj_token')) return;
    try {
      const response = await apiClient.get('/alerts/');
      const mapped = response.data.map(a => {
        const typeConfig = alertTypes[a.alert_type] || { label: 'تنبيه مالي', color: '#6b7280' };
        return {
          id:     a.id,
          type:   a.alert_type,
          title:  typeConfig.label,
          desc:   a.message,
          time:   new Date(a.created_at).toLocaleDateString('ar-SA', { hour: 'numeric', minute: 'numeric' }),
          unread: !a.is_read,
        };
      });
      setAlerts(mapped);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      // Only show mock data when the server is completely unreachable (no response)
      if (!err.response) {
        setAlerts([
          { id: 'mock-1', type: 'savings_created',   title: alertTypes.savings_created.label,   desc: 'تم إنشاء حصالة "شراء سيارة" بنجاح، نتمنى لك رحلة ادخار موفقة!',       time: 'الآن',        unread: true },
          { id: 'mock-2', type: 'savings_deduction', title: alertTypes.savings_deduction.label, desc: 'تم استقطاع مبلغ 500 ر.س بنجاح لحصالة "رحلة السفر".',                  time: 'قبل ساعتين',  unread: true },
          { id: 'mock-3', type: 'goal_milestone',    title: alertTypes.goal_milestone.label,    desc: 'رائع! لقد تجاوزت 50% من هدفك المالي لحصالة "زواج".',                   time: 'أمس',         unread: true },
        ]);
        setUnreadCount(3);
      }
    }
  };

  const fetchUnreadCount = async () => {
    // Guard — never fire unauthenticated requests
    if (!localStorage.getItem('siraj_token')) return;
    try {
      const response = await apiClient.get('/alerts/unread-count');
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  };

  // FIX: Effect depends on isAuthenticated — starts fetching only after login,
  // clears interval immediately after logout.
  useEffect(() => {
    if (!isAuthenticated) return; // Don't fetch until authenticated

    fetchAlerts();
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // Re-run when auth state changes

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, unread: false } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const addAlert = async (type, category, thresholdAmount, message) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/alerts/', {
        alert_type:       type,
        category:         category || 'عام',
        threshold_amount: parseFloat(thresholdAmount) || 0.0,
        message,
        is_active:        true,
      });
      fetchAlerts();
      fetchUnreadCount();
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to create custom alert:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertsContext.Provider value={{ alerts, alertTypes, markAsRead, addAlert, unreadCount, fetchAlerts, loading }}>
      {children}
    </AlertsContext.Provider>
  );
};
