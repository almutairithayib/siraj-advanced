import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, X, Check, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const riskConfig = {
  low: { label: 'منخفضة', color: '#16a34a' },
  medium: { label: 'متوسطة', color: '#d97706' },
  high: { label: 'مرتفعة', color: '#dc2626' },
};

const defaultRecommendation = {
  title: 'صندوق نماء المتوازن',
  reason: 'بناءً على تحليل وضعك المالي ونسبة ادخارك الشهرية، هذا الصندوق يناسب أهدافك على المدى المتوسط بمخاطرة منخفضة ونمو مستقر.',
};

export default function InvestmentPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [recommendation, setRecommendation] = useState(defaultRecommendation);
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const [portfolioProfit, setPortfolioProfit] = useState(0);
  const [portfolioProfitPct, setPortfolioProfitPct] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppsRes, recsRes, reqsRes] = await Promise.all([
        apiClient.get('/investment/opportunities'),
        apiClient.get('/investment/recommendations'),
        apiClient.get('/investment/requests'),
      ]);

      setOpportunities(oppsRes.data);

      // Map dynamic recommendation (take first one if available)
      if (recsRes.data && recsRes.data.length > 0) {
        const topRec = recsRes.data[0];
        setRecommendation({
          title: topRec.opportunity.name,
          reason: topRec.rationale,
        });
      }

      // Compute dynamic portfolio summary
      const activeReqs = reqsRes.data || [];
      const totalInvested = activeReqs.reduce((acc, req) => acc + req.amount, 0);
      
      // Calculate dynamic profit based on returns
      let totalProfit = 0;
      activeReqs.forEach(req => {
        const rate = req.expected_return || 5.0;
        totalProfit += req.amount * (rate / 100);
      });

      setPortfolioTotal(totalInvested > 0 ? totalInvested : 62900);
      setPortfolioProfit(totalProfit > 0 ? totalProfit : 3120);
      setPortfolioProfitPct(totalInvested > 0 ? parseFloat(((totalProfit / totalInvested) * 100).toFixed(1)) : 5.2);

    } catch (err) {
      console.error('Failed to fetch investment data:', err);
      // Fallback offline data for Alinma Bank products
      setOpportunities([
        {
          id: '1',
          name: 'صندوق الإنماء المتداول (الإنماء ريت)',
          product_type: 'fund',
          risk_level: 'medium',
          expected_return: 6.5,
          min_investment: 1000,
          description: 'صندوق استثمار عقاري متداول يهدف إلى تحقيق توزيعات نقدية دورية من خلال الاستثمار في عقارات مطورة ومدرة للدخل.'
        },
        {
          id: '2',
          name: 'صندوق الإنماء للسيولة بالريال',
          product_type: 'fund',
          risk_level: 'low',
          expected_return: 4.2,
          min_investment: 500,
          description: 'صندوق استثماري مفتوح يهدف إلى تنمية رأس المال مع المحافظة على السيولة العالية بمخاطر منخفضة.'
        },
        {
          id: '3',
          name: 'صندوق الإنماء للأسهم السعودية',
          product_type: 'fund',
          risk_level: 'high',
          expected_return: 12.0,
          min_investment: 2000,
          description: 'صندوق يستثمر في أسهم الشركات السعودية المتوافقة مع الضوابط الشرعية بهدف تنمية رأس المال على المدى الطويل.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!amount || !selected) return;
    const parsedAmount = parseFloat(amount);

    if (parsedAmount < selected.min_investment) {
      alert(`الحد الأدنى للاستثمار في هذه الفرصة هو ${selected.min_investment.toLocaleString()} ر.س`);
      return;
    }

    try {
      await apiClient.post('/investment/requests', {
        product_name: selected.name,
        product_type: selected.product_type,
        amount: parsedAmount,
        risk_level: selected.risk_level,
        expected_return: selected.expected_return
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelected(null);
        setAmount('');
        fetchData();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit investment request:', err);
      alert('حدث خطأ أثناء الاكتتاب: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getProductTypeLabel = (type) => {
    if (type === 'sukuk') return 'صكوك';
    if (type === 'fund') return 'صندوق استثماري';
    if (type === 'ipo') return 'IPO';
    return type;
  };

  return (
    <div className="fin-page">
      <h1 className="page-title">الاستثمار</h1>

      {/* Portfolio Summary */}
      <div className="balance-card">
        <p className="balance-label">إجمالي محفظتك الاستثمارية</p>
        <p className="balance-value">
          {portfolioTotal.toLocaleString()} <span className="balance-unit">ر.س</span>
        </p>
        <span className="balance-trend">
          <TrendingUp size={13} /> +{portfolioProfit.toLocaleString()} ر.س ({portfolioProfitPct}%)
        </span>
      </div>

      {/* AI Recommendation */}
      <div className="tip-card">
        <div className="tip-header">
          <Sparkles size={16} />
          <span>توصية سراج الذكية</span>
        </div>
        <p className="tip-text">
          <strong>{recommendation.title}</strong> — {recommendation.reason}
        </p>
        <div style={{ marginTop: '0.75rem' }}>
          <Link 
            to="/siraj-ai" 
            state={{ initialPrompt: `أريد الاستفسار عن توصية الاستثمار في: ${recommendation.title}` }}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <MessageSquare size={15} />
            تحدث مع سراج حول التوصية
          </Link>
        </div>
      </div>

      {/* Opportunities */}
      <div className="section-header">
        <h2 className="section-title">فرص استثمارية</h2>
        <span className="section-view-all">عرض الكل</span>
      </div>

      {loading && opportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          جاري تحميل الفرص الاستثمارية...
        </div>
      ) : (
        <div className="invest-list">
          {opportunities.map((op) => (
            <button key={op.id} className="invest-card" onClick={() => setSelected(op)}>
              <div className="invest-card-top">
                <span
                  className="invest-risk-badge"
                  style={{ color: riskConfig[op.risk_level]?.color || '#6b7280', background: `${riskConfig[op.risk_level]?.color || '#6b7280'}1a` }}
                >
                  مخاطرة {riskConfig[op.risk_level]?.label || op.risk_level}
                </span>
                <span className="invest-type">{getProductTypeLabel(op.product_type)}</span>
              </div>
              <p className="invest-name">{op.name}</p>
              <div className="invest-card-bottom">
                <span className="invest-return">عائد متوقع {op.expected_return}%</span>
                <span className="invest-min">حد أدنى {op.min_investment.toLocaleString()} ر.س</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Investment Request Modal */}
      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">{selected.name}</h3>
            </div>

            {!submitted ? (
              <>
                <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selected.description}
                </div>
                <div className="input-group">
                  <label className="input-label">مبلغ الاستثمار (ر.س)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder={`الحد الأدنى ${selected.min_investment.toLocaleString()} ر.س`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="fin-form-actions">
                  <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                    <X size={15} /> إلغاء
                  </button>
                  <button className="btn btn-primary fin-submit-btn" onClick={handleSubmit}>
                    <Check size={15} /> تأكيد الاستثمار
                  </button>
                </div>
              </>
            ) : (
              <div className="fin-success-card">
                <Check size={32} color="#16a34a" />
                <p>تم إرسال طلب الاستثمار بنجاح</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}