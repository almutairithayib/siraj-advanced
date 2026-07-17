import React, { useState, useEffect } from 'react';
import { X, Leaf, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

export default function NamaInvestmentModal({ onClose }) {
  const [amount, setAmount] = useState(50000);
  const [duration, setDuration] = useState(3);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const simulateNamaProduct = (amt, dur) => {
      if (dur === 1 && amt < 200000) {
        return { error: "الحد الأدنى للاستثمار لمدة شهر هو 200,000 ريال" };
      } else if (dur === 3 && amt < 50000) {
        return { error: "الحد الأدنى للاستثمار لمدة 3 أشهر هو 50,000 ريال" };
      }

      let expectedRate = 0.0;
      if (dur === 1) {
          if (amt >= 20000000) expectedRate = 5.68;
          else if (amt >= 10000000) expectedRate = 5.51;
          else if (amt >= 2000000) expectedRate = 5.40;
          else expectedRate = 5.11;
      } else if (dur === 3) {
          if (amt >= 20000000) expectedRate = 6.03;
          else if (amt >= 10000000) expectedRate = 5.85;
          else if (amt >= 2000000) expectedRate = 5.73;
          else if (amt >= 200000) expectedRate = 5.43;
          else expectedRate = 4.52;
      }

      const annualProfit = amt * (expectedRate / 100);
      const totalEarnedProfit = annualProfit * (dur / 12);

      const aiInsight = "بناءً على خطتك، العرض متوافق تماماً مع الضوابط الشرعية. الميزة الأقوى لراحة بالك هنا أن الوعاء يقتصر على أصول معفاة أو مدفوعة الزكاة مسبقاً، لذلك لا توجد أي زكاة مستحقة عليك كفرد!";

      return {
          expected_rate_percent: expectedRate,
          total_earned_profit: totalEarnedProfit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          ai_insight: aiInsight
      };
    };

    if (amount > 0) {
      const res = simulateNamaProduct(parseFloat(amount), parseInt(duration));
      if (res.error) {
        setError(res.error);
        setResults(null);
      } else {
        setError('');
        setResults(res);
      }
    }
  }, [amount, duration]);

  const handleDurationClick = (val) => {
    setDuration(val);
    if (val === 1 && amount < 200000) {
      setAmount(200000);
    }
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    // محاكاة طلب فتح الحساب للاستعراض
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000); // إغلاق بعد 3 ثواني
    }, 1200);
  };

  return (
    <div className="drawer-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="fin-form-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '0', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
            <Leaf color="#10b981" size={20} /> منتج نماء الاستثماري (الإنماء)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%' }}>
                <ShieldCheck size={64} color="#10b981" />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-primary)' }}>تم ربط الاستثمار بنجاح! 🎉</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>تم تأكيد اشتراكك في وعاء "نماء" الاستثماري بنجاح. مدخراتك الآن تنمو بأمان وبدون زكاة مستحقة.</p>
          </div>
        ) : (
          <>
            <div className="input-group" style={{ marginBottom: '15px' }}>
          <label className="input-label">مبلغ الاستثمار (ر.س)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label className="input-label">فترة الاشتراك</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              onClick={() => handleDurationClick(1)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: duration === 1 ? '#e8734f' : 'rgba(255,255,255,0.05)',
                color: duration === 1 ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              فترة قصيرة (شهر واحد)
            </button>
            <button 
              onClick={() => handleDurationClick(3)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: duration === 3 ? '#e8734f' : 'rgba(255,255,255,0.05)',
                color: duration === 3 ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              فترة طويلة (3 أشهر)
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            ⚠️ {error}
          </div>
        )}

        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>معدل الربح المتوقع</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#f59e0b' }}>{results.expected_rate_percent}%</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>الربح عند الاستحقاق</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <TrendingUp size={16} /> +{results.total_earned_profit}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '15px', borderRadius: '12px', fontSize: '12px', color: '#60a5fa', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '8px' }}>
                <Sparkles size={14} /> رؤية سراج الذكية:
              </div>
              {results.ai_insight}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleConfirm}
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '5px', padding: '14px', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <span>جاري توثيق العملية...</span>
              ) : (
                <><ShieldCheck size={18} /> تأكيد استثمار معفى من الزكاة</>
              )}
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
