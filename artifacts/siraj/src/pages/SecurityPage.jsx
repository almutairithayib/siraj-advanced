import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Eye, Key, Smartphone, Fingerprint, Activity, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SecurityPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [alertHandled, setAlertHandled] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleAlert = (action) => {
    if (action === 'freeze') {
      setAlertMessage('تم إيقاف العملية مؤقتاً وتجميد البطاقة لحمايتك.');
    } else {
      setAlertMessage('تم تأكيد العملية بصفتها آمنة.');
    }
    setAlertHandled(true);
    sessionStorage.setItem('securityAlertHandled', 'true');
  };

  const securitySteps = [
    { id: 1, label: 'التحقق بخطوتين (2FA)', status: 'enabled', icon: Smartphone },
    { id: 2, label: 'البصمة الحيوية', status: 'enabled', icon: Fingerprint },
    { id: 3, label: 'تحديث كلمة المرور', status: 'pending', icon: Key, hint: 'مرت 90 يوماً على آخر تحديث' },
    { id: 4, label: 'التحقق من الأجهزة المتصلة', status: 'pending', icon: Lock, hint: 'تم تسجيل دخول من جهاز جديد' },
  ];

  const recentActivities = [
    { id: 1, type: 'login', status: 'success', desc: 'تسجيل دخول ناجح (iPhone 14)', time: 'اليوم، 10:42 ص' },
    { id: 2, type: 'transaction', status: 'warning', desc: 'عملية شراء دولية قيد المراجعة', amount: '850 ر.س', time: 'أمس، 11:20 م' },
    { id: 3, type: 'setting', status: 'success', desc: 'تفعيل التنبيهات الذكية', time: 'أمس، 05:15 م' },
  ];

  const securityScore = 75;

  return (
    <div className="fin-page">
      <h1 className="page-title">مكافحة الاحتيال والأمان</h1>
      
      <div className="fin-tabs">
        <button 
          className={`fin-tab ${activeTab === 'overview' ? 'active' : ''}`} 
          onClick={() => setActiveTab('overview')}
        >
          نظرة عامة
        </button>
        <button 
          className={`fin-tab ${activeTab === 'alerts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('alerts')}
        >
          الأنشطة المشبوهة
        </button>
        <button 
          className={`fin-tab ${activeTab === 'tips' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tips')}
        >
          نصائح سراج
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="fin-form-card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.05, transform: 'rotate(15deg)' }}>
              <ShieldCheck size={200} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>مؤشر أمان الحساب</h3>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', borderRadius: '50%', border: `8px solid ${securityScore >= 80 ? '#10b981' : '#f59e0b'}`, marginBottom: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)' }}>{securityScore}%</span>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
              مستوى الأمان لديك {securityScore >= 80 ? 'ممتاز' : 'جيد'}. يوجد بعض الخطوات الموصى بها لرفع مستوى الحماية إلى 100%.
            </p>
          </div>

          <h3 className="section-title" style={{ marginTop: '25px', marginBottom: '15px' }}>خطوات حماية حسابك</h3>
          <div className="fin-products-grid" style={{ gridTemplateColumns: '1fr' }}>
            {securitySteps.map(step => {
              const Icon = step.icon;
              const isEnabled = step.status === 'enabled';
              return (
                <div key={step.id} className="fin-product-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: isEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: isEnabled ? '#10b981' : '#f59e0b' }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>{step.label}</p>
                      {step.hint && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{step.hint}</p>}
                    </div>
                  </div>
                  <div>
                    {isEnabled ? (
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>مُفعل</span>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: '6px 15px', fontSize: '12px' }}>تفعيل الآن</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="fin-history-list">
          {alertHandled ? (
            <div className="fin-history-item" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div className="fin-history-icon" style={{ background: '#10b981' }}>
                <ShieldCheck size={16} color="#fff" />
              </div>
              <div className="fin-history-info">
                <p className="fin-history-type" style={{ color: '#10b981' }}>تمت معالجة التنبيه بنجاح</p>
                <p className="fin-history-date">{alertMessage}</p>
              </div>
            </div>
          ) : (
            <div className="fin-history-item" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div className="fin-history-icon" style={{ background: '#ef4444' }}>
                <ShieldAlert size={16} color="#fff" />
              </div>
              <div className="fin-history-info">
                <p className="fin-history-type" style={{ color: '#ef4444' }}>عملية شراء مشبوهة</p>
                <p className="fin-history-date">متجر غير معروف دولياً — 850 ر.س</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleAlert('freeze')} className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>هذا ليس أنا</button>
                <button onClick={() => handleAlert('confirm')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>نعم، عمليتي</button>
              </div>
            </div>
          )}

          <h3 className="section-title" style={{ marginTop: '25px', marginBottom: '15px' }}>الأنشطة الأخيرة</h3>
          {recentActivities.map(activity => (
            <div key={activity.id} className="fin-history-item">
              <div className="fin-history-icon" style={{ background: activity.status === 'success' ? '#10b981' : '#f59e0b' }}>
                <Activity size={16} color="#fff" />
              </div>
              <div className="fin-history-info">
                <p className="fin-history-type">{activity.desc}</p>
                <p className="fin-history-date"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{activity.time}</p>
              </div>
              {activity.amount && <p className="fin-history-amount">{activity.amount}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tips' && (
        <div className="fin-products-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="fin-form-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Eye size={20} color="#3b82f6" />
              <h4 style={{ fontWeight: 'bold' }}>احذر من الهندسة الاجتماعية</h4>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              لا تشارك رمز التفعيل (OTP) أو معلوماتك المصرفية مع أي شخص يدعي أنه من سراج أو البنك. نحن لن نطلب منك هذه المعلومات أبداً.
            </p>
          </div>
          
          <div className="fin-form-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Lock size={20} color="#10b981" />
              <h4 style={{ fontWeight: 'bold' }}>تأمين البطاقات أثناء السفر</h4>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              استخدم ميزة "القفل المؤقت" للبطاقة إذا كنت لا تستخدمها، أو قم بتقليل حد الشراء الدولي قبل السفر لتجنب السحوبات غير المتوقعة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
