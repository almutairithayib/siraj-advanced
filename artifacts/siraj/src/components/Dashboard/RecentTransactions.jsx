import React from 'react';
import { ShoppingBag, Zap, Car, Utensils, ArrowDownLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const categoryIcons = {
  'الراتب': ArrowDownLeft,
  'السكن والخدمات': Home,
  'الغذاء والبقالة': Utensils,
  'النقل والسيارات': Car,
  'الترفيه والمطاعم': Utensils,
  'الفواتير والالتزامات': Zap,
  'التسوق والمستلزمات': ShoppingBag,
};

const mockTransactions = [
  { name: 'مطعم البيك', amount: -85, date: 'اليوم', category: 'الترفيه والمطاعم' },
  { name: 'فاتورة الكهرباء', amount: -420, date: 'أمس', category: 'الفواتير والالتزامات' },
  { name: 'راتب شهري', amount: 8200, date: 'قبل 3 أيام', category: 'الراتب' },
  { name: 'محطة وقود', amount: -150, date: 'قبل 4 أيام', category: 'النقل والسيارات' },
  { name: 'تسوق أونلاين', amount: -310, date: 'الأسبوع الماضي', category: 'التسوق والمستلزمات' },
];

export default function RecentTransactions({ transactions = [] }) {
  const displayTxns = transactions.length > 0
    ? transactions.map(t => ({
        name: t.description || t.category,
        amount: t.type === 'expense' ? -t.amount : t.amount,
        date: new Date(t.transaction_date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
        category: t.category,
      }))
    : mockTransactions;

  return (
    <div className="chart-card">
      <div className="section-header" style={{ marginTop: 0, marginBottom: 10 }}>
        <h2 className="chart-title" style={{ marginBottom: 0 }}>آخر المعاملات</h2>
        <Link to="/transactions" className="section-view-all">عرض الكل</Link>
      </div>

      <div className="transaction-list">
        {displayTxns.map((t, i) => {
          const Icon = categoryIcons[t.category] || ShoppingBag;
          return (
            <div key={i} className="transaction-item">
              <div className="transaction-icon">
                <Icon size={16} />
              </div>
              <div className="transaction-info">
                <p className="transaction-name">{t.name}</p>
                <p className="transaction-date">{t.date}</p>
              </div>
              <p className={`transaction-amount ${t.amount > 0 ? 'positive' : ''}`}>
                {t.amount > 0 ? '+' : ''}
                {t.amount.toLocaleString()} ر.س
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}