import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const GoalsContext = createContext(null);

export const emojiMap = {
  hajj: '🕋',
  umrah: '🌙',
  marriage: '💍',
  travel: '✈️',
  ramadan: '🌙',
  eid: '🎉',
  school: '🎒',
  custom: '🎯',
};

export const GoalsProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/goals/');
      // Map API response to UI goals (with emojis)
      const mapped = response.data.map(g => ({
        id: g.id,
        name: g.title,
        target: g.target_amount,
        saved: g.saved_amount,
        emoji: emojiMap[g.goal_type] || '🎯',
        goal_type: g.goal_type,
        target_date: g.target_date,
        plan_details: g.plan_details,
        status: g.status,
      }));
      setGoals(mapped);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/goals/templates');
      const mapped = response.data.map(t => ({
        id: t.id,
        goal_type: t.goal_type,
        label: t.title,
        emoji: emojiMap[t.goal_type] || '🎯',
        suggestedAmount: t.default_target_amount,
        description: t.description,
        suggestedMonths: t.suggested_timeline_months
      }));
      setTemplates(mapped);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchTemplates();
  }, []);

  const addGoal = async (title, targetAmount, goalType, targetDateStr, savedAmount = 0) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/goals/', {
        title,
        target_amount: parseFloat(targetAmount),
        goal_type: goalType || 'custom',
        target_date: targetDateStr || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        saved_amount: parseFloat(savedAmount) || 0.0,
        status: 'active'
      });
      
      const newGoal = {
        id: response.data.id,
        name: response.data.title,
        target: response.data.target_amount,
        saved: response.data.saved_amount,
        emoji: emojiMap[response.data.goal_type] || '🎯',
        goal_type: response.data.goal_type,
        target_date: response.data.target_date,
        plan_details: response.data.plan_details,
        status: response.data.status,
      };

      setGoals((prev) => [newGoal, ...prev]);
      return { success: true, data: newGoal };
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
      
      const updated = {
        id: response.data.id,
        name: response.data.title,
        target: response.data.target_amount,
        saved: response.data.saved_amount,
        emoji: emojiMap[response.data.goal_type] || '🎯',
        goal_type: response.data.goal_type,
        target_date: response.data.target_date,
        plan_details: response.data.plan_details,
        status: response.data.status,
      };

      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update goal progress:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  const generateAiPlan = async (id) => {
    try {
      const response = await apiClient.post(`/goals/${id}/plan`);
      const updated = {
        id: response.data.id,
        name: response.data.title,
        target: response.data.target_amount,
        saved: response.data.saved_amount,
        emoji: emojiMap[response.data.goal_type] || '🎯',
        goal_type: response.data.goal_type,
        target_date: response.data.target_date,
        plan_details: response.data.plan_details,
        status: response.data.status,
      };

      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to generate AI plan for goal:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        templates,
        loading,
        error,
        fetchGoals,
        fetchTemplates,
        addGoal,
        updateGoalProgress,
        generateAiPlan,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};