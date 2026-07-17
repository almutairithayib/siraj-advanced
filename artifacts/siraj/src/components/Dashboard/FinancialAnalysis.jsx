import React from 'react';

const mockExpenseData = [
  { name: 'سكن', percent: 35, color: '#e8734f' },
  { name: 'طعام', percent: 20, color: '#f0997b' },
  { name: 'مواصلات', percent: 15, color: '#6b7280' },
  { name: 'ترفيه', percent: 12, color: '#9ca3af' },
  { name: 'فواتير', percent: 10, color: '#4b5563' },
  { name: 'أخرى', percent: 8, color: '#374151' },
];

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

function DonutChart({ data }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <svg width="110" height="110" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth="16" />
      {data.map((item, i) => {
        const dash = (item.percent / 100) * circumference;
        const circle = (
          <circle
            key={i}
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offsetAcc}
            transform="rotate(-90 65 65)"
          />
        );
        offsetAcc += dash;
        return circle;
      })}
    </svg>
  );
}

export default function FinancialAnalysis({ score = 72, grade, insights, categoryBreakdown = [] }) {
  const gaugeRadius = 50;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const gaugeProgress = (score / 100) * gaugeCircumference;

  const displayGrade = grade || (score >= 75 ? 'ممتاز' : score >= 50 ? 'جيد' : 'يحتاج تحسين');
  const displayInsights = insights || 'ملخص أدائك المالي لهذا الشهر';

  const displayData = categoryBreakdown.length > 0
    ? categoryBreakdown.map((item, idx) => ({
        name: item.category,
        percent: Math.round(item.percentage),
        color: categoryColors[item.category] || `hsl(${(idx * 55) % 360}, 70%, 60%)`,
      }))
    : mockExpenseData;

  return (
    <div className="analysis-section">
      <div className="analysis-header">
        <h2 className="analysis-title">التحليلات المالية</h2>
        <p className="analysis-subtitle">{displayInsights}</p>
      </div>

      <div className="analysis-cards-row">
        {/* Donut Card */}
        <div className="analysis-card">
          <p className="analysis-card-title">توزيع المصروفات</p>
          <div className="donut-card-body-vertical">
            <div className="donut-chart-wrapper">
              <DonutChart data={displayData} />
            </div>
            <div className="donut-legend-grid">
              {displayData.map((item) => (
                <div key={item.name} className="donut-legend-item">
                  <span className="donut-legend-dot" style={{ backgroundColor: item.color }} />
                  <span className="donut-legend-label">{item.name}</span>
                  <span className="donut-legend-percent">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Health Score Card */}
        <div className="analysis-card analysis-card-center">
          <p className="analysis-card-title">الصحة المالية</p>
          <svg width="120" height="75" viewBox="0 0 150 90">
            <path
              d="M 20 75 A 55 55 0 0 1 130 75"
              fill="none"
              stroke="var(--bg-secondary)"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M 20 75 A 55 55 0 0 1 130 75"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${gaugeProgress} ${gaugeCircumference}`}
            />
          </svg>
          <p className="gauge-score">{score}</p>
          <p className="gauge-label">{displayGrade}</p>
        </div>
      </div>
    </div>
  );
}