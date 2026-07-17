import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Calendar, Trophy, ChevronLeft, Plus, Coins } from 'lucide-react';
import useAlerts from '../../hooks/useAlerts';
import useGoals from '../../hooks/useGoals';

const iconMap = {
  budget: AlertTriangle,
  budget_breach: AlertTriangle,
  spending_spike: TrendingUp,
  spike: TrendingUp,
  bill: Calendar,
  goal: Trophy,
  goal_milestone: Trophy,
  savings_created: Plus,
  savings_deduction: Coins,
};

export default function DashboardPreviewCards() {
  const { alerts, alertTypes } = useAlerts();
  const { goals } = useGoals();

  const activeAlert = alerts.find((a) => a.unread);
  const topGoal = goals[0];
  const goalPct = topGoal ? Math.min(100, Math.round((topGoal.saved / topGoal.target) * 100)) : 0;

  const alertConfig = activeAlert ? alertTypes[activeAlert.type] : null;
  const AlertIcon = activeAlert ? (iconMap[activeAlert.type] || AlertTriangle) : null;

return (
  <>
    {topGoal && (
      <Link to="/goals" className="dash-preview-goal">
        <div className="dash-preview-goal-header">
          <span>{topGoal.emoji} {topGoal.name}</span>
          <span className="savings-goal-percent">{goalPct}%</span>
        </div>
        <div className="savings-goal-bar">
          <div className="savings-goal-fill" style={{ width: `${goalPct}%` }} />
        </div>
        <p className="savings-goal-detail">
          {topGoal.saved.toLocaleString()} من {topGoal.target.toLocaleString()} ر.س
        </p>
      </Link>
    )}

    {/* Active alert banner removed from Dashboard per user request */}
  </>
);
}