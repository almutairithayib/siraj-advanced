import React, { useState } from 'react';
import { Plus, X, PartyPopper, Calendar, Edit3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSavings from '../hooks/useSavings';
import NamaInvestmentModal from '../components/Savings/NamaInvestmentModal';

export default function SavingsPage() {
  const { plans, addPlan, updateProgress, fetchPlanProgress, loading } = useSavings();
  const [showForm, setShowForm] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [newProgressVal, setNewProgressVal] = useState('');
  const [celebrate, setCelebrate] = useState(null);
  const [showNamaModal, setShowNamaModal] = useState(false);

  // Create Plan state
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [months, setMonths] = useState('');

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!name || !target) return;
    const res = await addPlan(name, target, months);
    if (res.success) {
      setName('');
      setTarget('');
      setMonths('');
      setShowForm(false);
    } else {
      alert("فشل إنشاء الحصالة: " + res.error);
    }
  };

  const handleOpenProgress = async (plan) => {
    setSelectedPlan(plan);
    setNewProgressVal(plan.current_amount);
    setShowProgressModal(true);
    setSelectedProgress(null);

    const res = await fetchPlanProgress(plan.id);
    if (res.success) {
      setSelectedProgress(res.data);
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const res = await updateProgress(selectedPlan.id, newProgressVal);
    if (res.success) {
      const pct = Math.min(100, Math.round((Number(newProgressVal) / selectedPlan.target_amount) * 100));
      if (pct >= 100) {
        setCelebrate(selectedPlan.id);
      }
      setShowProgressModal(false);
      setSelectedPlan(null);
      setSelectedProgress(null);
    } else {
      alert("فشل تحديث المبلغ: " + res.error);
    }
  };

  return (
    <div className="fin-page">
      <div className="section-header" style={{ marginTop: 0 }}>
        <h1 className="page-title">الادخار</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link 
            to="/siraj-ai" 
            state={{ initialPrompt: 'أريد مساعدة في إنشاء خطة ادخارية ذكية لحصالة جديدة. أريد أن تقترح لي اسم الحصالة، المدة المناسبة، الهدف، ومبلغ الاستقطاع الشهري بناءً على وضعي المالي حتى أحقق هدفي.' }}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '6px 12px', background: 'rgba(232, 115, 79, 0.1)', color: '#e8734f', borderColor: 'rgba(232, 115, 79, 0.2)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
          >
            <Sparkles size={14} /> أنشئ خطة بالـ AI
          </Link>
          <button className="savings-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} /> حصالة جديدة
          </button>
        </div>
      </div>

      {/* Alinma Savings Account Banner */}
      <div style={{ background: 'linear-gradient(135deg, #e8734f, #d05b38)', padding: '20px', borderRadius: '16px', color: 'white', marginBottom: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(232, 115, 79, 0.2)' }}>
        <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>حساب الانماء الادخاري</h3>
        <p style={{ fontSize: '13px', marginBottom: '15px', opacity: 0.9, position: 'relative', zIndex: 1 }}>اربط حصالاتك بحساب ادخاري حقيقي يمنحك عوائد تنافسية - مناسب لك بنسبة 90%</p>
        <button 
          onClick={() => setShowNamaModal(true)}
          style={{ background: 'white', color: '#d05b38', padding: '8px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', border: 'none', position: 'relative', zIndex: 1, cursor: 'pointer' }}
        >
          اربط الحصالة بالحساب ‹
        </button>
      </div>

      {loading && plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          جاري تحميل حصالاتك الادخارية...
        </div>
      ) : (
        <div className="savings-plans-list">
          {plans.map((plan) => {
            const saved = plan.current_amount || 0;
            const target = plan.target_amount || 1;
            const pct = Math.min(100, Math.round((saved / target) * 100));
            const complete = pct >= 100;
            return (
              <div 
                key={plan.id} 
                className="savings-goal-card" 
                onClick={() => handleOpenProgress(plan)}
                style={{ cursor: 'pointer' }}
              >
                <div className="savings-goal-header">
                  <span>{plan.goal_name}</span>
                  <span className="savings-goal-percent">{pct}%</span>
                </div>
                <div className="savings-goal-bar">
                  <div className="savings-goal-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="savings-goal-footer">
                  <p className="savings-goal-detail">
                    {saved.toLocaleString()} من {target.toLocaleString()} ر.س
                  </p>
                  {complete ? (
                    <button 
                      className="savings-celebrate-btn" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCelebrate(plan.id); 
                      }}
                    >
                      <PartyPopper size={13} /> تم تحقيق الهدف!
                    </button>
                  ) : (
                    <p className="savings-next-contribution">
                      <Calendar size={12} /> القسط شهرياً {(plan.monthly_contribution || 0).toLocaleString()} ر.س — مستهدف في: {plan.target_date}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Plan Drawer */}
      {showForm && (
        <div className="drawer-overlay" onClick={() => setShowForm(false)}>
          <form className="drawer-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddPlan}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">إنشاء حصالة جديدة</h3>
            </div>

            <div className="input-group">
              <label className="input-label">اسم الهدف</label>
              <input
                required
                className="input-field"
                placeholder="مثال: رحلة السفر"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">المبلغ المستهدف (ر.س)</label>
              <input
                required
                type="number"
                className="input-field"
                placeholder="مثال: 15000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">المدة (بالأشهر)</label>
              <input
                required
                type="number"
                className="input-field"
                placeholder="مثال: 12"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
              />
            </div>

            <div className="fin-form-actions" style={{ flexDirection: 'column' }}>
              <Link 
                to="/siraj-ai" 
                state={{ initialPrompt: 'أريد مساعدة في إنشاء خطة ادخارية ذكية لحصالة جديدة. أريد أن تقترح لي اسم الحصالة، المدة المناسبة، الهدف، ومبلغ الاستقطاع الشهري بناءً على وضعي المالي حتى أحقق هدفي.' }}
                style={{ width: '100%', background: '#e8734f', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', marginBottom: '10px' }}
              >
                <Sparkles size={16} /> أنشئ لي خطة بالذكاء الاصطناعي
              </Link>
              
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                  <X size={15} /> إلغاء
                </button>
                <button type="submit" className="btn btn-primary fin-submit-btn" style={{ flex: 1 }}>
                  إنشاء الحصالة
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Update Progress & Details Drawer */}
      {showProgressModal && selectedPlan && (
        <div className="drawer-overlay" onClick={() => { setShowProgressModal(false); setSelectedPlan(null); setSelectedProgress(null); }}>
          <form className="drawer-content" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdateProgress}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">تفاصيل وتحديث الحصالة</h3>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedPlan.goal_name}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الهدف الإجمالي: {selectedPlan.target_amount.toLocaleString()} ر.س</span>
            </div>

            {selectedProgress && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: 'rgba(var(--primary-rgb), 0.03)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>الشهور المتبقية</span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedProgress.months_remaining} شهر</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>الالتزام بالخطة</span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: selectedProgress.on_track ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {selectedProgress.on_track ? 'مستمر بنجاح' : 'متأخر عن الخطة'}
                  </span>
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">المبلغ المدخر حالياً (ر.س)</label>
              <input
                required
                type="number"
                className="input-field"
                value={newProgressVal}
                onChange={(e) => setNewProgressVal(e.target.value)}
              />
            </div>

            <div className="fin-form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowProgressModal(false); setSelectedPlan(null); setSelectedProgress(null); }}>
                <X size={15} /> إغلاق
              </button>
              <button type="submit" className="btn btn-primary fin-submit-btn">
                <Edit3 size={14} /> تحديث الرصيد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Celebration Overlay */}
      {celebrate && (
        <div className="celebrate-overlay" onClick={() => setCelebrate(null)}>
          <div className="celebrate-card">
            <div className="celebrate-icon">
              <PartyPopper size={40} />
            </div>
            <p className="celebrate-title">مبروك! 🎉</p>
            <p className="celebrate-text">
              حققت هدف "{plans.find((p) => p.id === celebrate)?.goal_name}" بنجاح
            </p>
            <button className="btn btn-primary" onClick={() => setCelebrate(null)}>
              رائع!
            </button>
          </div>
        </div>
      )}

      {showNamaModal && (
        <NamaInvestmentModal onClose={() => setShowNamaModal(false)} />
      )}
    </div>
  );
}