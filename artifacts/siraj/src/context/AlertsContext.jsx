import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AlertsContext = createContext(null);

export const alertTypes = {
  budget: { label: 'تجاوز الميزانية', color: '#dc2626' },
  budget_breach: { label: 'تجاوز الميزانية', color: '#dc2626' },
  spending_spike: { label: 'ارتفاع مفاجئ بالإنفاق', color: '#d97706' },
  bill: { label: 'فاتورة مستحقة', color: '#2563eb' },
  goal: { label: 'إنجاز هدف', color: '#16a34a' },
  goal_milestone: { label: 'إنجاز هدف', color: '#16a34a' },
  savings_created: { label: 'إنشاء حصالة جديدة', color: '#8b5cf6' },
  savings_deduction: { label: 'استقطاع ادخاري', color: '#0ea5e9' },
};

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await apiClient.get('/alerts/');
      // Map backend alert object to frontend structure
      const mapped = response.data.map(a => {
        const typeConfig = alertTypes[a.alert_type] || { label: 'تنبيه مالي', color: '#6b7280' };
        return {
          id: a.id,
          type: a.alert_type,
          title: typeConfig.label,
          desc: a.message,
          time: new Date(a.created_at).toLocaleDateString('ar-SA', { hour: 'numeric', minute: 'numeric' }),
          unread: !a.is_read
        };
      });
      setAlerts(mapped);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      // Hackathon Fallback: load mock alerts relevant to savings if network fails
      if (err.message.includes('Network Error') || !err.response) {
        setAlerts([
          {
            id: 'mock-1',
            type: 'savings_created',
            title: alertTypes.savings_created.label,
            desc: 'تم إنشاء حصالة "شراء سيارة" بنجاح، نتمنى لك رحلة ادخار موفقة!',
            time: 'الآن',
            unread: true
          },
          {
            id: 'mock-2',
            type: 'savings_deduction',
            title: alertTypes.savings_deduction.label,
            desc: 'تم استقطاع مبلغ 500 ر.س بنجاح لحصالة "رحلة السفر".',
            time: 'قبل ساعتين',
            unread: true
          },
          {
            id: 'mock-3',
            type: 'goal_milestone',
            title: alertTypes.goal_milestone.label,
            desc: 'رائع! لقد تجاوزت 50% من هدفك المالي لحصالة "زواج".',
            time: 'أمس',
            unread: true
          }
        ]);
        setUnreadCount(3);
      }
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/alerts/unread-count');
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  };

  // Poll for unread alerts every 30 seconds
  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/alerts/${id}/read`);
      // Update local state
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
        alert_type: type,
        category: category || 'عام',
        threshold_amount: parseFloat(thresholdAmount) || 0.0,
        message: message,
        is_active: true
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