import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';

export const GoalsContext = createContext(null);

export const emojiMap = {
  hajj:     '🕋',
  umrah:    '🌙',
  marriage: '💍',
  travel:   '✈️',
  ramadan:  '🌙',
  eid:      '🎉',
  school:   '🎒',
  custom:   '🎯',
};

const mapGoal = g => ({
  id:          g.id,
  name:        g.title,
  target:      g.target_amount,
  saved:       g.saved_amount,
  emoji:       emojiMap[g.goal_type] || '🎯',
  goal_type:   g.goal_type,
  target_date: g.target_date,
  plan_details:g.plan_details,
  status:      g.status,
});

export const GoalsProvider = ({ children }) => {
  const [goals, setGoals]         = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // FIX: Only fetch after authentication
  const { isAuthenticated } = useContext(AuthContext);

  const fetchGoals = async () => {
    // Guard — skip if no token (prevents pre-login 401 race condition)
    if (!localStorage.getItem('siraj_token')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/goals/');
      setGoals(response.data.map(mapGoal));
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    // Guard — skip if no token
    if (!localStorage.getItem('siraj_token')) return;
    try {
      const response = await apiClient.get('/goals/templates');
      setTemplates(response.data.map(t => ({
        id:               t.id,
        goal_type:        t.goal_type,
        label:            t.title,
        emoji:            emojiMap[t.goal_type] || '🎯',
        suggestedAmount:  t.default_target_amount,
        description:      t.description,
        suggestedMonths:  t.suggested_timeline_months,
      })));
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  // FIX: Depend on isAuthenticated so fetching starts only after login
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchGoals();
    fetchTemplates();
  }, [isAuthenticated]);

  const addGoal = async (title, targetAmount, goalType, targetDateStr, savedAmount = 0) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/goals/', {
        title,
        target_amount: parseFloat(targetAmount),
        goal_type:     goalType || 'custom',
        target_date:   targetDateStr || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        saved_amount:  parseFloat(savedAmount) || 0.0,
        status:        'active',
      });
      setGoals(prev => [mapGoal(response.data), ...prev]);
      return { success: true, data: mapGoal(response.data) };
    } catch (err) {
      console.error('Failed to create goal:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (id, savedAmount) => {
    try {
      const response = await apiClient.put(`/goals/${id}`, {
        saved_amount: parseFloat(savedAmount),
      });
      const updated = mapGoal(response.data);
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update goal progress:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  const generateAiPlan = async (id) => {
    try {
      const response = await apiClient.post(`/goals/${id}/plan`);
      const updated = mapGoal(response.data);
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to generate AI plan for goal:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  return (
    <GoalsContext.Provider value={{ goals, templates, loading, error, fetchGoals, fetchTemplates, addGoal, updateGoalProgress, generateAiPlan }}>
      {children}
    </GoalsContext.Provider>
  );
};
