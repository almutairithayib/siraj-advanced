import React from 'react';
import { Wallet, TrendingDown, PiggyBank, Percent } from 'lucide-react';

const kpis = [
  { label: 'الدخل الشهري', value: '18,540', unit: 'ر.س', icon: Wallet, trend: '+12%', up: true },
  { label: 'المصروفات', value: '11,280', unit: 'ر.س', icon: TrendingDown, trend: '-4%', up: false },
  { label: 'الادخار', value: '6,200', unit: 'ر.س', icon: PiggyBank, trend: '+8%', up: true },
  { label: 'نسبة الادخار', value: '33', unit: '%', icon: Percent, trend: '+2%', up: true },
];

export default function KPICards() {
  return (
    <div className="kpi-grid">
      {kpis.map(({ label, value, unit, icon: Icon, trend, up }) => (
        <div key={label} className="kpi-card">
          <div className="kpi-icon">
            <Icon size={18} />
          </div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value">
            {value} <span className="kpi-unit">{unit}</span>
          </p>
          <span className={`kpi-trend ${up ? 'up' : 'down'}`}>{trend}</span>
        </div>
      ))}
    </div>
  );
}