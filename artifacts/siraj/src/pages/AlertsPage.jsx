import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Calendar, Trophy, Plus, X, Settings2, Sparkles, Coins } from 'lucide-react';
import useAlerts from '../hooks/useAlerts';

const iconMap = {
  budget: AlertTriangle,
  budget_breach: AlertTriangle,
  spending_spike: TrendingUp,
  bill: Calendar,
  goal: Trophy,
  goal_milestone: Trophy,
  savings_created: Plus,
  savings_deduction: Coins,
};

export default function AlertsPage() {
  const { alerts, alertTypes, markAsRead, addAlert, unreadCount, loading } = useAlerts();
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // feed or smart
  const [enabledTypes, setEnabledTypes] = useState({ budget: true, spending_spike: true, bill: true, goal: true });
  
  // Smart Limits State
  const [shoppingLimit, setShoppingLimit] = useState(1500);
  const [transportLimit, setTransportLimit] = useState(500);
  
  // Create Alert Form state
  const [alertType, setAlertType] = useState('bill');
  const [category, setCategory] = useState('عام');
  const [threshold, setThreshold] = useState('');
  const [message, setMessage] = useState('');

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    const finalMsg = message || `تنبيه مخصص لفئة ${category}`;
    const res = await addAlert(alertType, category, threshold, finalMsg);
    if (res.success) {
      setThreshold('');
      setMessage('');
      setShowCreate(false);
    } else {
      alert("فشل إنشاء التنبيه: " + res.error);
    }
  };

  return (
    <div className="fin-page">
      <div className="section-header" style={{ marginTop: 0 }}>
        
        <h1 className="page-title">
          التنبيهات {unreadCount > 0 && <span className="alerts-unread-badge">{unreadCount}</span>}
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="alerts-icon-btn" onClick={() => setShowSettings(true)}>
            <Settings2 size={16} />
          </button>
          <button className="savings-add-btn" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> تنبيه جديد
          </button>
        </div>
      </div>

      <div className="fin-tabs">
        <button 
          className={`fin-tab ${activeTab === 'feed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('feed')}
        >
          سجل التنبيهات
        </button>
        <button 
          className={`fin-tab ${activeTab === 'smart' ? 'active' : ''}`} 
          onClick={() => setActiveTab('smart')}
        >
          الضبط الذكي (AI)
        </button>
      </div>

      {activeTab === 'feed' ? (
        <div className="alerts-feed">
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              لا يوجد تنبيهات نشطة حالياً.
            </div>
          ) : (
            alerts.map((a) => {
              const config = alertTypes[a.type] || { label: 'تنبيه مالي', color: '#6b7280' };
              const Icon = iconMap[a.type] || AlertTriangle;
              return (
                <button
                  key={a.id}
                  className={`alert-item ${a.unread ? 'unread' : ''}`}
                  onClick={() => a.unread && markAsRead(a.id)}
                  style={{ cursor: a.unread ? 'pointer' : 'default' }}
                >
                  <div className="alert-icon" style={{ color: config.color, background: `${config.color}1a` }}>
                    <Icon size={17} />
                  </div>
                  <div className="alert-content">
                    <div className="alert-title-row">
                      <span className="alert-title">{a.title}</span>
                      {a.unread && <span className="alert-dot" />}
                    </div>
                    <p className="alert-desc">{a.desc}</p>
                    <span className="alert-time">{a.time}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="fin-form-card" style={{ marginTop: '20px' }}>
          <h3 className="section-title" style={{ marginBottom: '10px' }}>⚙️ إعداد التنبيهات الذكية</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '25px' }}>
            حدد الحد الأقصى للصرف الشهري لكل فئة ليقوم "سراج" بتنبيهك استباقياً قبل تجاوزه بناءً على تحليل نمط صرفك.
          </p>

          <div className="fin-product-card" style={{ padding: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>التسوق والترفيه</span>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>تنبيه سقف التسوق</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ر.س</span>
              <input 
                type="number" 
                value={shoppingLimit} 
                onChange={(e) => setShoppingLimit(e.target.value)}
                className="input-field"
                style={{ textAlign: 'center', fontWeight: 'bold', margin: 0 }}
              />
            </div>
            <div 
              style={{ marginTop: '12px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px' }}
              onClick={() => setShoppingLimit(1240)}
            >
              <Sparkles size={12} />
              <span>اقتراح سراج: 1,240 ر.س (متوسط صرفك لآخر 3 أشهر) - <b>تطبيق</b></span>
            </div>
          </div>

          <div className="fin-product-card" style={{ padding: '15px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>المواصلات والسيارة</span>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>تنبيه سقف المواصلات</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ر.س</span>
              <input 
                type="number" 
                value={transportLimit} 
                onChange={(e) => setTransportLimit(e.target.value)}
                className="input-field"
                style={{ textAlign: 'center', fontWeight: 'bold', margin: 0 }}
              />
            </div>
            <div 
              style={{ marginTop: '12px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px' }}
              onClick={() => setTransportLimit(430)}
            >
              <Sparkles size={12} />
              <span>اقتراح سراج: 430 ر.س (معدل صرفك المستقر) - <b>تطبيق</b></span>
            </div>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', background: '#10b981', borderColor: '#10b981' }}>
            حفظ الإعدادات الذكية
          </button>
        </div>
      )}

      {/* Create Custom Alert Drawer */}
      {showCreate && (
        <div className="drawer-overlay" onClick={() => setShowCreate(false)}>
          <form className="drawer-content" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateAlert}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">إنشاء تنبيه مخصص</h3>
            </div>

            <div className="input-group">
              <label className="input-label">نوع التنبيه</label>
              <select className="input-field" value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                {Object.entries(alertTypes)
                  .filter((v, i, a) => a.findIndex(t => t[1].label === v[1].label) === i)
                  .map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">الفئة المستهدفة</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="عام">عام</option>
                <option value="الغذاء والبقالة">الغذاء والبقالة</option>
                <option value="السكن والمرافق">السكن والمرافق</option>
                <option value="الترفيه والمطاعم">الترفيه والمطاعم</option>
                <option value="التسوق والمستلزمات">التسوق والمستلزمات</option>
                <option value="النقل والسيارات">النقل والسيارات</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">الحد المالي للتنبيه (ر.س)</label>
              <input
                required
                type="number"
                className="input-field"
                placeholder="مثال: 1000"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">نص رسالة التنبيه</label>
              <input
                required
                type="text"
                className="input-field"
                placeholder="مثال: مصاريف التسوق تجاوزت الحد المسموح!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="fin-form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                <X size={15} /> إلغاء
              </button>
              <button type="submit" className="btn btn-primary fin-submit-btn" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'إنشاء التنبيه'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alert Settings Drawer */}
      {showSettings && (
        <div className="drawer-overlay" onClick={() => setShowSettings(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">إعدادات التنبيهات</h3>
            </div>

            <div className="settings-group" style={{ marginBottom: '1rem' }}>
              {Object.entries(alertTypes)
                .filter((v, i, a) => a.findIndex(t => t[1].label === v[1].label) === i)
                .map(([key, val]) => {
                const TypeIcon = iconMap[key] || AlertTriangle;
                return (
                  <div key={key} className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-icon" style={{ color: val.color }}>
                        <TypeIcon size={16} />
                      </div>
                      <span>{val.label}</span>
                    </div>
                    <button
                      className={`settings-toggle ${enabledTypes[key] ? 'on' : ''}`}
                      onClick={() => setEnabledTypes({ ...enabledTypes, [key]: !enabledTypes[key] })}
                    >
                      <span className="settings-toggle-dot" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSettings(false)}>
              حفظ الإعدادات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}