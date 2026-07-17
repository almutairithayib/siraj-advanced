import React, { useState, useContext } from 'react';
import { X, Sparkles, Calendar, Plus } from 'lucide-react';
import { GoalsContext } from '../context/GoalsContext';

const defaultTemplates = [
  { id: 'hajj', goal_type: 'hajj', label: 'حج', emoji: '🕋', suggestedAmount: 15000, suggestedMonths: 12 },
  { id: 'umrah', goal_type: 'umrah', label: 'عمرة', emoji: '🌙', suggestedAmount: 6000, suggestedMonths: 3 },
  { id: 'marriage', goal_type: 'marriage', label: 'زواج', emoji: '💍', suggestedAmount: 50000, suggestedMonths: 24 },
  { id: 'travel', goal_type: 'travel', label: 'سفر', emoji: '✈️', suggestedAmount: 10000, suggestedMonths: 6 },
  { id: 'ramadan', goal_type: 'ramadan', label: 'رمضان', emoji: '🌙', suggestedAmount: 3000, suggestedMonths: 4 },
  { id: 'eid', goal_type: 'eid', label: 'العيد', emoji: '🎉', suggestedAmount: 2000, suggestedMonths: 2 },
  { id: 'school', goal_type: 'school', label: 'مدارس', emoji: '🎒', suggestedAmount: 4000, suggestedMonths: 5 },
];

const timeline = [
  { event: 'رمضان', date: '18 فبراير 2027' },
  { event: 'عيد الفطر', date: '20 مارس 2027' },
  { event: 'موسم الحج', date: '2 يونيو 2027' },
  { event: 'بداية العام الدراسي', date: '24 أغسطس 2026' },
];

export default function GoalsPage() {
  const context = useContext(GoalsContext);
  const { goals, templates, addGoal, generateAiPlan, loading } = context || { goals: [], templates: [] };

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [aiPlan, setAiPlan] = useState(null);
  const [createdGoalId, setCreatedGoalId] = useState(null);

  const displayTemplates = templates.length > 0 ? templates : defaultTemplates;

  const openTemplate = (t) => {
    setSelectedTemplate(t);
    setGoalName(t.label);
    setGoalAmount(t.suggestedAmount.toString());
    setAiPlan(null);
    setCreatedGoalId(null);
  };

  const handleGeneratePlan = async () => {
    const amount = Number(goalAmount) || 0;
    if (!goalName || !amount) return;

    let goalId = createdGoalId;
    if (!goalId) {
      const targetDateObj = new Date();
      const monthsVal = selectedTemplate ? selectedTemplate.suggestedMonths : 6;
      targetDateObj.setMonth(targetDateObj.getMonth() + monthsVal);
      const targetDateStr = targetDateObj.toISOString().split('T')[0];

      const res = await addGoal(
        goalName,
        amount,
        selectedTemplate?.goal_type || 'custom',
        targetDateStr,
        0
      );
      if (res.success) {
        goalId = res.data.id;
        setCreatedGoalId(goalId);
      } else {
        alert('فشل إنشاء الهدف: ' + res.error);
        return;
      }
    }

    const planRes = await generateAiPlan(goalId);
    if (planRes.success) {
      const plan = planRes.data.plan_details;
      const recommendations = plan.ai_recommendations || [];
      setAiPlan({
        monthly: plan.monthly_target,
        months: selectedTemplate ? selectedTemplate.suggestedMonths : 6,
        tip: recommendations.join('\n'),
      });
    } else {
      alert('فشل توليد الخطة بالذكاء الاصطناعي: ' + planRes.error);
    }
  };

  const handleCreateGoal = async () => {
    if (createdGoalId) {
      closeModal();
      return;
    }

    const amount = Number(goalAmount) || 0;
    if (!goalName || !amount) return;

    const targetDateObj = new Date();
    const monthsVal = selectedTemplate ? selectedTemplate.suggestedMonths : 6;
    targetDateObj.setMonth(targetDateObj.getMonth() + monthsVal);
    const targetDateStr = targetDateObj.toISOString().split('T')[0];

    const res = await addGoal(
      goalName,
      amount,
      selectedTemplate?.goal_type || 'custom',
      targetDateStr,
      0
    );
    if (res.success) {
      closeModal();
    } else {
      alert('فشل إنشاء الهدف: ' + res.error);
    }
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setCustomMode(false);
    setGoalName('');
    setGoalAmount('');
    setAiPlan(null);
    setCreatedGoalId(null);
  };

  return (
    <div className="fin-page">
      <div className="section-header" style={{ marginTop: 0 }}>
        <button className="savings-add-btn" onClick={() => setCustomMode(true)}>
          <Plus size={16} /> هدف مخصص
        </button>
        <h1 className="page-title">الأهداف المالية</h1>
      </div>

      {loading && goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          جاري تحميل أهدافك المالية...
        </div>
      ) : goals.length > 0 && (
        <div className="savings-plans-list">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <div key={g.id} className="savings-goal-card">
                <div className="savings-goal-header">
                  <span>{g.emoji} {g.name}</span>
                  <span className="savings-goal-percent">{pct}%</span>
                </div>
                <div className="savings-goal-bar">
                  <div className="savings-goal-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="savings-goal-footer" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p className="savings-goal-detail">
                    {g.saved.toLocaleString()} من {g.target.toLocaleString()} ر.س
                  </p>
                  {g.plan_details?.monthly_target && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                      الادخار المطلوب شهرياً: {g.plan_details.monthly_target.toLocaleString()} ر.س
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="section-title" style={{ marginTop: '0.25rem' }}>قوالب جاهزة</p>
      <div className="goals-templates-grid">
        {displayTemplates.map((t) => (
          <button key={t.id} className="goal-template-card" onClick={() => openTemplate(t)}>
            <span className="goal-template-emoji">{t.emoji}</span>
            <span className="goal-template-label">{t.label}</span>
          </button>
        ))}
      </div>

      <p className="section-title" style={{ marginTop: '0.25rem' }}>مناسبات قادمة</p>
      <div className="chart-card">
        <div className="goals-timeline">
          {timeline.map((item, i) => (
            <div key={i} className="goals-timeline-item">
              <div className="goals-timeline-dot" />
              <div className="goals-timeline-info">
                <span className="goals-timeline-event">{item.event}</span>
                <span className="goals-timeline-date">
                  <Calendar size={11} /> {item.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(selectedTemplate || customMode) && (
        <div className="drawer-overlay" onClick={closeModal}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">
                {selectedTemplate ? `${selectedTemplate.emoji} هدف ${selectedTemplate.label}` : 'هدف مخصص جديد'}
              </h3>
            </div>

            <div className="input-group">
              <label className="input-label">اسم الهدف</label>
              <input
                className="input-field"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="مثال: رحلة العائلة"
              />
            </div>
            <div className="input-group">
              <label className="input-label">المبلغ المستهدف (ر.س)</label>
              <input
                type="number"
                className="input-field"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="مثال: 10000"
              />
            </div>

            {!aiPlan ? (
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleGeneratePlan}>
                <Sparkles size={15} /> أنشئ لي خطة بالذكاء الاصطناعي
              </button>
            ) : (
              <div className="tip-card" style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                <div className="tip-header">
                  <Sparkles size={15} />
                  <span>خطة سراج المقترحة</span>
                </div>
                <p className="tip-text">{aiPlan.tip}</p>
              </div>
            )}

            <div className="fin-form-actions">
              <button className="btn btn-secondary" onClick={closeModal}>
                <X size={15} /> إلغاء
              </button>
              <button className="btn btn-primary fin-submit-btn" onClick={handleCreateGoal}>
                {createdGoalId ? 'إغلاق' : 'إنشاء الهدف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}