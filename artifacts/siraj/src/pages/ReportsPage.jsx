import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import apiClient from '../api/client';

const periods = ['هذا الشهر', 'الشهر الماضي', 'آخر 3 أشهر', 'تاريخ مخصص'];

const categoryColors = {
  'الراتب': '#16a34a',
  'السكن والخدمات': '#e8734f',
  'الغذاء والبقالة': '#f0997b',
  'النقل والسيارات': '#6b7280',
  'الترفيه والمطاعم': '#f59e0b',
  'الفواتير والالتزامات': '#4b5563',
  'التسوق والمستلزمات': '#374151',
  'عام': '#d1d5db',
};

const getPeriodDates = (periodName) => {
  const today = new Date();
  let startDate, endDate;

  if (periodName === 'هذا الشهر') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = today;
  } else if (periodName === 'الشهر الماضي') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (periodName === 'آخر 3 أشهر') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    endDate = today;
  }

  return {
    startStr: startDate.toISOString().split('T')[0],
    endStr: endDate.toISOString().split('T')[0],
  };
};

export default function ReportsPage() {
  const [period, setPeriod] = useState(periods[0]);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom date state
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [applyCustom, setApplyCustom] = useState(0);

  // Computed data state
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        let startStr, endStr;
        if (period === 'تاريخ مخصص') {
          if (!customStart || !customEnd) {
             setLoading(false);
             return;
          }
          startStr = customStart;
          endStr = customEnd;
        } else {
          const dates = getPeriodDates(period);
          startStr = dates.startStr;
          endStr = dates.endStr;
        }
        const res = await apiClient.get(`/transactions/?start_date=${startStr}&end_date=${endStr}`);
        const transactions = res.data || [];

        // Sum income and expenses
        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryMap = {};

        transactions.forEach((t) => {
          if (t.type === 'income') {
            totalIncome += t.amount;
          } else {
            totalExpenses += t.amount;
            if (!categoryMap[t.category]) {
              categoryMap[t.category] = 0;
            }
            categoryMap[t.category] += t.amount;
          }
        });

        // Map category breakdown
        const breakdown = Object.entries(categoryMap).map(([name, amt], idx) => {
          const percent = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
          return {
            name,
            amount: amt,
            percent,
            color: categoryColors[name] || `hsl(${(idx * 55) % 360}, 70%, 60%)`,
          };
        });

        setSummary({ income: totalIncome, expenses: totalExpenses });
        setCategoryBreakdown(breakdown);
      } catch (err) {
        console.error('Failed to generate report details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [period, applyCustom]);

  const netFlow = summary.income - summary.expenses;
  const totalFlow = summary.income + summary.expenses;
  const incomePct = totalFlow > 0 ? Math.round((summary.income / totalFlow) * 100) : 50;
  const expensePct = totalFlow > 0 ? Math.round((summary.expenses / totalFlow) * 100) : 50;

  return (
    <div className="fin-page">
      <div className="section-header" style={{ marginTop: 0 }}>
        <h1 className="page-title">التقارير</h1>
        <button className="alerts-icon-btn" style={{ width: 'auto', padding: '0 12px', borderRadius: 20 }}>
          <Download size={15} />
        </button>
      </div>

      <div className="reports-period-selector">
        <button className="reports-period-btn" onClick={() => setShowPeriodMenu(!showPeriodMenu)}>
          <span>{period}</span>
          <ChevronDown size={15} />
        </button>
        {showPeriodMenu && (
          <div className="reports-period-menu">
            {periods.map((p) => (
              <button
                key={p}
                className={`reports-period-option ${p === period ? 'active' : ''}`}
                onClick={() => {
                  setPeriod(p);
                  setShowPeriodMenu(false);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {period === 'تاريخ مخصص' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>من تاريخ</label>
              <input 
                type="date" 
                className="input-field" 
                style={{ margin: 0, width: '100%' }}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>إلى تاريخ</label>
              <input 
                type="date" 
                className="input-field" 
                style={{ margin: 0, width: '100%' }}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', height: '42px' }}
            onClick={() => setApplyCustom(prev => prev + 1)}
            disabled={!customStart || !customEnd}
          >
            تطبيق
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          جاري حساب التقرير وتفصيل التدفقات...
        </div>
      ) : (
        <>
          <div className="reports-summary-row">
            <div className="reports-summary-card">
              <div className="reports-summary-icon income">
                <TrendingUp size={16} />
              </div>
              <p className="reports-summary-label">الدخل</p>
              <p className="reports-summary-value">{summary.income.toLocaleString()} ر.س</p>
            </div>
            <div className="reports-summary-card">
              <div className="reports-summary-icon expense">
                <TrendingDown size={16} />
              </div>
              <p className="reports-summary-label">المصروفات</p>
              <p className="reports-summary-value">{summary.expenses.toLocaleString()} ر.س</p>
            </div>
          </div>

          <div className="chart-card">
            <p className="chart-title">صافي التدفق النقدي</p>
            <div className="reports-flow-bar">
              <div
                className="reports-flow-fill income"
                style={{ width: `${incomePct}%` }}
              />
            </div>
            <div className="reports-flow-labels">
              <span className="reports-flow-label income">
                دخل {incomePct}%
              </span>
              <span className="reports-flow-label expense">
                مصروفات {expensePct}%
              </span>
            </div>
            <p className="reports-net-value">
              صافي الادخار: <strong style={{ color: netFlow >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{netFlow.toLocaleString()} ر.س</strong>
            </p>
          </div>

          <div className="chart-card">
            <p className="chart-title">تفصيل المصروفات حسب الفئة</p>
            {categoryBreakdown.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                لا توجد مصروفات مسجلة في هذه الفترة.
              </p>
            ) : (
              <div className="reports-category-list">
                {categoryBreakdown.map((c) => (
                  <div key={c.name} className="reports-category-row">
                    <div className="reports-category-info">
                      <span className="reports-category-dot" style={{ backgroundColor: c.color }} />
                      <span className="reports-category-name">{c.name}</span>
                    </div>
                    <span className="reports-category-amount">{c.amount.toLocaleString()} ر.س</span>
                    <span className="reports-category-percent">{c.percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert('تم تصدير التقرير')}>
            <Download size={15} /> تصدير التقرير (PDF)
          </button>
        </>
      )}
    </div>
  );
}