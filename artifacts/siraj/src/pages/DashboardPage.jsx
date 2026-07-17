import { Link } from 'react-router-dom';
import { Plus, FileText, CreditCard, ArrowLeftRight, Coins, TrendingUp, TrendingDown, Wallet, Percent, ChevronUp, ChevronDown, Eye, ChevronRight, Sparkles, EyeOff, Target, ShieldAlert } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import TopExpensesBar from '../components/Dashboard/TopExpensesBar.jsx';
import FinancialAnalysis from '../components/Dashboard/FinancialAnalysis.jsx';
import SirajTip from '../components/Dashboard/SirajTip.jsx';
import DashboardPreviewCards from '../components/Dashboard/DashboardPreviewCards.jsx';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api/client';

const quickActions = [
  { label: 'التقارير', icon: FileText, path: '/reports' },
  { label: 'الادخار والأهداف', icon: Coins, path: '/savings' },
  { label: 'الاستثمار', icon: TrendingUp, path: '/investment' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  return 'مساء الخير';
};

function Sparkline({ data, color }) {
  const chartData = data.map((val, i) => ({
    name: `فترة ${i + 1}`,
    value: val
  }));

  return (
    <div style={{ width: '70px', height: '35px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: '#fff' }}
            itemStyle={{ color: color, fontSize: '11px', fontWeight: 'bold' }}
            labelStyle={{ display: 'none' }}
            formatter={(value) => [`${value.toLocaleString()}`, '']}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const promos = [
  { title: 'صندوق الإنماء المتداول', subtitle: 'فرصة استثمارية تناسب خطتك بنسبة 95%', link: '/investment', btn: 'استثمر الآن ‹' },
  { title: 'صكوك الإنماء', subtitle: 'استثمار مستقر ومضمون - مناسب لك بنسبة 85%', link: '/investment', btn: 'اكتشف المزيد ‹' },
  { title: 'حساب الادخار الاستثماري', subtitle: 'عوائد تنافسية لمدخراتك - مناسب لك بنسبة 90%', link: '/savings', btn: 'افتح الحساب ‹' }
];

function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % promos.length);
        setFade(false);
      }, 300); // fade out duration
    }, 4500); // Change every 4.5 seconds
    return () => clearInterval(timer);
  }, []);

  const promo = promos[currentIndex];

  return (
    <div className="promo-banner">
      <div className="promo-blob" />
      <div 
        className="promo-text" 
        style={{ 
          opacity: fade ? 0 : 1, 
          transform: fade ? 'translateY(10px)' : 'translateY(0)', 
          transition: 'all 0.3s ease-in-out' 
        }}
      >
        <p className="promo-title">{promo.title}</p>
        <p className="promo-subtitle">{promo.subtitle}</p>
        <Link to={promo.link} className="promo-btn">{promo.btn}</Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.full_name || 'محمد العنزي';
  const [hideBalances, setHideBalances] = useState(false);

  const [overview, setOverview] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSecurityHandled, setIsSecurityHandled] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('securityAlertHandled') === 'true') {
      setIsSecurityHandled(true);
    }
    const fetchDashboardData = async () => {
      try {
        const [overviewRes, healthRes, tipRes, breakdownRes, txnsRes] = await Promise.all([
          apiClient.get('/dashboard/overview'),
          apiClient.get('/dashboard/health-score'),
          apiClient.get('/dashboard/daily-tip'),
          apiClient.get('/dashboard/category-breakdown'),
          apiClient.get('/transactions/'),
        ]);

        setOverview(overviewRes.data);
        setHealthScore(healthRes.data);
        setDailyTip(tipRes.data.tip);
        setCategoryBreakdown(breakdownRes.data);
        setRecentTransactions(txnsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = overview ? [
    { label: 'الدخل الشهري', value: overview.total_income.toLocaleString(), icon: Wallet, trend: '12%', up: true, history: [15200, 16000, 16500, 17200, 17800, overview.total_income] },
    { label: 'المصروفات', value: overview.total_expense.toLocaleString(), icon: TrendingDown, trend: '4%', up: false, history: [9800, 10200, 9500, 10800, 11500, overview.total_expense] },
    { label: 'المدخرات', value: overview.total_savings.toLocaleString(), icon: Coins, trend: '6%', up: true, history: [7200, 7600, 8100, 8500, 8900, overview.total_savings] },
    { label: 'نسبة الادخار', value: Math.round(overview.savings_rate).toString(), unit: '%', icon: Percent, trend: '2%', up: true, history: [28, 29, 30, 31, 32, Math.round(overview.savings_rate)] },
  ] : [
    { label: 'الدخل الشهري', value: '18,540', icon: Wallet, trend: '12%', up: true, history: [15200, 16000, 16500, 17200, 17800, 18540] },
    { label: 'المصروفات', value: '11,280', icon: TrendingDown, trend: '4%', up: false, history: [9800, 10200, 9500, 10800, 11500, 11280] },
    { label: 'المدخرات', value: '9,320', icon: Coins, trend: '6%', up: true, history: [7200, 7600, 8100, 8500, 8900, 9320] },
    { label: 'نسبة الادخار', value: '33', unit: '%', icon: Percent, trend: '2%', up: true, history: [28, 29, 30, 31, 32, 33] },
  ];

  // Dynamically compute remaining balance (baseline 30,000 + income - expense)
  const currentBalance = overview ? (30000 + overview.total_income - overview.total_expense) : 42860;

  return (
    <div className="dashboard-container">
      {/* Hero: Greeting + Balance */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-top">
          <p className="balance-label">إجمالي الرصيد</p>
          <button className="dashboard-eye-btn" onClick={() => setHideBalances(!hideBalances)}>
            {hideBalances ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <p className="dashboard-greeting-text">{getGreeting()}، {displayName.split(' ')[0]} 👋</p>

        <p className="balance-value">
          {hideBalances ? '••••••' : currentBalance.toLocaleString()} <span className="balance-unit">ر.س</span>
        </p>

        <div className="dashboard-hero-bottom">
          <Link to="/transactions" className="dashboard-details-link">
            <ChevronRight size={14} /> التفاصيل
          </Link>
          <span className="balance-trend">
            8.4% هذا الشهر <ChevronUp size={13} />
          </span>
        </div>
      </div>

      {/* Security Alert Banner */}
      {!isSecurityHandled && (
        <div style={{ margin: '0 20px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ background: '#ef4444', padding: '8px', borderRadius: '50%' }}>
              <ShieldAlert size={16} color="#fff" />
            </div>
            <div>
              <h4 style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>تنبيه أمني: عملية دولية قيد المراجعة</h4>
              <p style={{ color: '#f87171', fontSize: '11px' }}>يرجى مراجعة عملية شراء بـ 850 ر.س فوراً.</p>
            </div>
          </div>
          <Link to="/security" state={{ activeTab: 'alerts' }} className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', fontSize: '12px', padding: '6px 12px' }}>المراجعة</Link>
        </div>
      )}

      {/* Promo Banner Carousel */}
      <PromoCarousel />

      {/* Siraj Tip (Moved above AI Suggestion per user request) */}
      <SirajTip tip={dailyTip} />

      {/* AI Savings Suggestion */}
      <AiSuggestionCarousel />

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        {quickActions.map(({ label, icon: Icon, path }) => (
          <Link key={label} to={path} className="quick-action-square" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="quick-action-square-icon">
              <Icon size={20} />
            </div>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Goal Progress Widget */}
      <Link to="/savings" style={{ display: 'block', margin: '0 20px 25px', background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={16} color="#10b981" /> إنجاز الهدف: الدفعة الأولى للسيارة</h3>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>90%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: '90%', background: '#10b981', height: '100%', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>المتبقي: 6,000 ر.س</span>
          <span>الهدف الإجمالي: 60,000 ر.س</span>
        </div>
      </Link>

      {/* Section header */}
      <div className="section-header">
        <h2 className="section-title">نظرة عامة</h2>
        <Link to="/transactions" className="section-view-all">عرض الكل</Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, trend, up, history, unit }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon">
                <Icon size={17} />
              </div>
              <Sparkline data={history} color={up ? '#16a34a' : '#dc2626'} />
            </div>
            <p className="stat-label">{label}</p>
            <p className="stat-value">
              {hideBalances ? '••••' : value} <span className="stat-unit">{unit || 'ر.س'}</span>
            </p>
            <span className={`stat-trend ${up ? 'up' : 'down'}`}>
              {trend} {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </span>
          </div>
        ))}
      </div>
      
      <FinancialAnalysis 
        score={healthScore?.score} 
        grade={healthScore?.grade} 
        insights={healthScore?.insights} 
        categoryBreakdown={categoryBreakdown}
      />
      
      <TopExpensesBar categoryBreakdown={categoryBreakdown} />
      <DashboardPreviewCards />
    </div>
  );
}

const aiSuggestions = [
  { title: 'أنشئ حصالة سفر ✈️', desc: 'رتب لسفرتك من الآن عشان ما تضغط نفسك مالياً في الصيف.' },
  { title: 'أنشئ حصالة تعليم 📚', desc: 'استثمر في مستقبلك الأكاديمي وابدأ بالادخار لرسوم دراستك القادمة.' },
  { title: 'أنشئ صندوق طوارئ 🛡️', desc: 'تأمينك المالي يبدأ بحصالة للطوارئ تغطي نفقاتك وقت الحاجة المفاجئة.' },
  { title: 'أنشئ حصالة زواج 💍', desc: 'خطط ليومك الكبير براحة بال بعيداً عن الديون وتراكم المصاريف.' }
];

function AiSuggestionCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % aiSuggestions.length);
        setFade(false);
      }, 300);
    }, 5500); 
    return () => clearInterval(timer);
  }, []);

  const suggestion = aiSuggestions[currentIndex];

  return (
      <div style={{ margin: '0 20px 20px', background: 'linear-gradient(135deg, #001a2c 0%, #002840 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'absolute', left: '-20px', top: '-20px', opacity: 0.3 }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,115,79,0.4) 0%, transparent 70%)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ paddingRight: '4px', opacity: fade ? 0 : 1, transform: fade ? 'translateY(5px)' : 'translateY(0)', transition: 'all 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={16} color="var(--accent)" />
              <h3 style={{ color: '#ffffff', fontSize: '14.5px', fontWeight: 'bold' }}>{suggestion.title}</h3>
            </div>
            <p style={{ color: '#bdcad7', fontSize: '12px', lineHeight: '1.5' }}>{suggestion.desc}</p>
          </div>
          <Link to="/siraj-ai" style={{ background: 'var(--accent)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none', flexShrink: 0, boxShadow: '0 4px 10px rgba(232, 115, 79, 0.3)' }}>
            <Plus size={20} />
          </Link>
        </div>
      </div>
  );
}
