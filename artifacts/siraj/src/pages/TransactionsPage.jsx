import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Utensils, Zap, Car, ShoppingBag, ArrowDownLeft, Home, Trash2 } from 'lucide-react';
import apiClient from '../api/client';

const categoryIcons = {
  'الراتب': ArrowDownLeft,
  'السكن والخدمات': Home,
  'الغذاء والبقالة': Utensils,
  'النقل والسيارات': Car,
  'الترفيه والمطاعم': Utensils,
  'الفواتير والالتزامات': Zap,
  'التسوق والمستلزمات': ShoppingBag,
};

const filters = ['الكل', 'دخل', 'مصروفات'];

function groupByDate(list) {
  const groups = {};
  list.forEach((t) => {
    const label = new Date(t.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  });
  return groups;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('الكل');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('الغذاء والبقالة');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/transactions/');
      const mapped = response.data.map(t => ({
        id: t.id,
        name: t.description || t.category,
        category: t.category,
        amount: t.type === 'expense' ? -t.amount : t.amount,
        date: t.transaction_date,
        type: t.type,
      }));
      setTransactions(mapped);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      // Fallback offline data
      const today = new Date().toISOString().split('T')[0];
      setTransactions([
        { id: '1', name: 'راتب شهري', category: 'الراتب', amount: 15000, date: today, type: 'income' },
        { id: '2', name: 'بقالة التميمي', category: 'الغذاء والبقالة', amount: -350, date: today, type: 'expense' },
        { id: '3', name: 'محطة الدريس', category: 'النقل والسيارات', amount: -100, date: today, type: 'expense' },
        { id: '4', name: 'فاتورة الكهرباء', category: 'الفواتير والالتزامات', amount: -200, date: '2026-07-16', type: 'expense' },
        { id: '5', name: 'مطعم الرومانسية', category: 'الترفيه والمطاعم', amount: -250, date: '2026-07-15', type: 'expense' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async () => {
    if (!name || !amount) return;

    try {
      const transactionType = category === 'الراتب' ? 'income' : 'expense';
      const parsedAmount = parseFloat(amount);
      const response = await apiClient.post('/transactions/', {
        amount: parsedAmount,
        category: category,
        type: transactionType,
        description: name,
        transaction_date: new Date().toISOString().split('T')[0]
      });

      const newTxn = {
        id: response.data.id,
        name: response.data.description || response.data.category,
        category: response.data.category,
        amount: response.data.type === 'expense' ? -response.data.amount : response.data.amount,
        date: response.data.transaction_date,
        type: response.data.type
      };

      setTransactions(prev => [newTxn, ...prev]);
      setName('');
      setAmount('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create transaction:', err);
      alert('حدث خطأ أثناء إضافة المعاملة: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await apiClient.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('حدث خطأ أثناء حذف المعاملة: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filtered = transactions
    .filter((t) => {
      if (filter === 'دخل') return t.amount > 0;
      if (filter === 'مصروفات') return t.amount < 0;
      return true;
    })
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const grouped = groupByDate(filtered);

  return (
    <div className="fin-page">
      <div className="section-header" style={{ marginTop: 0 }}>
        <h1 className="page-title">المعاملات</h1>
      </div>

      <div className="txn-search-box">
        <Search size={16} color="var(--text-secondary)" />
        <input
          className="txn-search-input"
          placeholder="ابحث عن معاملة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="fin-tabs">
        {filters.map((f) => (
          <button
            key={f}
            className={`fin-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          جاري تحميل المعاملات...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          لا توجد معاملات تطابق البحث.
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <p className="txn-date-header">{date}</p>
            <div className="chart-card">
              <div className="transaction-list">
                {items.map((t) => {
                  const Icon = categoryIcons[t.category] || ShoppingBag;
                  return (
                    <div key={t.id} className="transaction-item">
                      <div className="transaction-icon">
                        <Icon size={16} />
                      </div>
                      <div className="transaction-info">
                        <p className="transaction-name">{t.name}</p>
                        <p className="transaction-date">{t.category}</p>
                      </div>
                      <p className={`transaction-amount ${t.amount > 0 ? 'positive' : ''}`}>
                        {t.amount > 0 ? '+' : ''}
                        {t.amount.toLocaleString()} ر.س
                      </p>
                      <button className="transaction-delete-btn" onClick={() => handleDeleteTransaction(t.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div className="drawer-overlay" onClick={() => setShowForm(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">إضافة معاملة جديدة</h3>
            </div>

            <div className="input-group">
              <label className="input-label">اسم المعاملة</label>
              <input
                className="input-field"
                placeholder="مثال: مطعم، فاتورة..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">المبلغ (ر.س)</label>
              <input
                type="number"
                className="input-field"
                placeholder="مثال: 150"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">الفئة</label>
              <select
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.keys(categoryIcons).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="fin-form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={15} /> إلغاء
              </button>
              <button className="btn btn-primary fin-submit-btn" onClick={handleAddTransaction}>
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}