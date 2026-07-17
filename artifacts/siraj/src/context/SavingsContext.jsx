import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';

export const SavingsContext = createContext(null);

export const SavingsProvider = ({ children }) => {
  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  // FIX: Only fetch after authentication
  const { isAuthenticated } = useContext(AuthContext);

  const fetchPlans = async () => {
    // Guard — skip if no token (prevents pre-login 401 race condition)
    if (!localStorage.getItem('siraj_token')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/savings/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch savings plans:', err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Depend on isAuthenticated so fetching starts only after login
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPlans();
  }, [isAuthenticated]);

  const addPlan = async (name, target, months) => {
    setLoading(true);
    try {
      const targetDateObj = new Date();
      targetDateObj.setMonth(targetDateObj.getMonth() + (Number(months) || 12));
      const targetDateStr = targetDateObj.toISOString().split('T')[0];
      const monthlyContribution = Number(target) / (Number(months) || 12);

      const response = await apiClient.post('/savings/plans', {
        goal_name:            name,
        target_amount:        parseFloat(target),
        current_amount:       0.0,
        target_date:          targetDateStr,
        monthly_contribution: parseFloat(monthlyContribution.toFixed(2)),
        status:               'active',
      });

      setPlans(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to create savings plan:', err);
      // Offline fallback — only when server is unreachable (no response)
      if (!err.response) {
        const targetDateObj = new Date();
        targetDateObj.setMonth(targetDateObj.getMonth() + (Number(months) || 12));
        const mockPlan = {
          id:                   Date.now().toString(),
          goal_name:            name,
          target_amount:        parseFloat(target),
          current_amount:       0.0,
          target_date:          targetDateObj.toISOString().split('T')[0],
          monthly_contribution: parseFloat((Number(target) / (Number(months) || 12)).toFixed(2)),
          status:               'active',
        };
        setPlans(prev => [mockPlan, ...prev]);
        return { success: true, data: mockPlan };
      }
      return { success: false, error: err.response?.data?.detail || err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (id, currentAmount) => {
    try {
      const response = await apiClient.put(`/savings/plans/${id}`, {
        current_amount: parseFloat(currentAmount),
      });
      setPlans(prev => prev.map(p => p.id === id ? response.data : p));
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to update savings plan progress:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  const fetchPlanProgress = async (id) => {
    try {
      const response = await apiClient.get(`/savings/plans/${id}/progress`);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to get savings plan progress:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  return (
    <SavingsContext.Provider value={{ plans, loading, error, fetchPlans, addPlan, updateProgress, fetchPlanProgress }}>
      {children}
    </SavingsContext.Provider>
  );
};
