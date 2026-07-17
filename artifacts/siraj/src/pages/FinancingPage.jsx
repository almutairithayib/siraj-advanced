import React, { useState, useEffect } from 'react';
import { User, Car, Home, GraduationCap, Clock, CheckCircle2, XCircle, ChevronLeft, Coins, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const productIcons = {
  personal: User,
  auto: Car,
  home: Home,
  education: GraduationCap,
  business: Coins,
};

const statusSteps = ['قيد المراجعة', 'تحت التقييم', 'موافقة نهائية'];

const statusMap = {
  pending: 0,
  under_review: 1,
  approved: 2,
  rejected: 2, // Map to final step but with a rejection visual style if needed, or simply 2
};

const getStatusIndex = (status) => {
  if (statusMap[status] !== undefined) return statusMap[status];
  return 0;
};

const getStatusLabel = (status) => {
  if (status === 'pending') return 'قيد المراجعة';
  if (status === 'under_review') return 'تحت التقييم';
  if (status === 'approved') return 'تمت الموافقة';
  if (status === 'rejected') return 'مرفوض';
  return status;
};

const tabs = ['تمويل جديد', 'متابعة الطلبات', 'سجل التمويل'];

export default function FinancingPage() {
  const [tab, setTab] = useState(tabs[0]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form fields
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, requestsRes] = await Promise.all([
        apiClient.get('/financing/products'),
        apiClient.get('/financing/requests'),
      ]);
      setProducts(productsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error('Failed to fetch financing data:', err);
      // Fallback offline data for Alinma Bank financing products
      setProducts([
        {
          id: '1',
          name: 'التمويل الشخصي',
          product_type: 'personal',
          profit_rate: 1.9,
          description: 'تمويل شخصي مرن يلبي جميع احتياجاتك مع سرعة في الإنجاز.',
          min_amount: 10000,
          max_amount: 500000,
          min_term_months: 12,
          max_term_months: 60,
          suitability: 95
        },
        {
          id: '2',
          name: 'تمويل السيارات',
          product_type: 'auto',
          profit_rate: 2.5,
          description: 'امتلك سيارة أحلامك بكل سهولة ويسر مع برامج تمويل السيارات من الإنماء.',
          min_amount: 30000,
          max_amount: 250000,
          min_term_months: 12,
          max_term_months: 60,
          suitability: 82
        },
        {
          id: '3',
          name: 'التمويل العقاري',
          product_type: 'home',
          profit_rate: 3.1,
          description: 'تمويل عقاري متوافق مع الأحكام الشرعية لتملك منزل العائلة.',
          min_amount: 200000,
          max_amount: 5000000,
          min_term_months: 60,
          max_term_months: 300,
          suitability: 45
        }
      ]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedProduct || !amount || !term) return;

    try {
      await apiClient.post('/financing/requests', {
        product_type: selectedProduct.product_type,
        amount: parseFloat(amount),
        term_months: parseInt(term),
        notes: notes || `طلب تمويل ${selectedProduct.name} عن طريق تطبيق سراج`
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedProduct(null);
        setAmount('');
        setTerm('');
        setNotes('');
        // Refresh requests and switch tab
        fetchData();
        setTab('متابعة الطلبات');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit financing request:', err);
      alert('حدث خطأ أثناء إرسال الطلب: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Active requests (pending / under_review)
  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'under_review');
  // Historic requests (approved / rejected)
  const historicRequests = requests.filter(r => r.status === 'approved' || r.status === 'rejected');

  return (
    <div className="fin-page">
      <h1 className="page-title">التمويل</h1>

      <div className="fin-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`fin-tab ${tab === t ? 'active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          جاري تحميل المنتجات والطلبات...
        </div>
      )}

      {tab === 'تمويل جديد' && !selectedProduct && (
        <div className="fin-products-grid">
          {products.map((p) => {
            const Icon = productIcons[p.product_type] || User;
            return (
              <div key={p.id} className="fin-product-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div className="fin-product-icon">
                    <Icon size={20} />
                  </div>
                  {p.suitability && (
                    <div style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
                      {p.suitability}% يناسبك
                    </div>
                  )}
                </div>
                <p className="fin-product-label" style={{ marginTop: '8px' }}>{p.name}</p>
                <p className="fin-product-desc" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                  نسبة المرابحة: {p.profit_rate}%
                </p>
                <p className="fin-product-desc">{p.description}</p>
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: '12px', padding: '0.5rem' }} onClick={() => setSelectedProduct(p)}>
                    تقديم الطلب
                  </button>
                  <Link 
                    to="/siraj-ai" 
                    state={{ initialPrompt: `أريد الاستفسار عن ${p.name} وهل هو مناسب لوضعي المالي بنسبة ${p.suitability}%؟` }}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '12px', padding: '0.5rem', display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#e8734f', background: 'rgba(232, 115, 79, 0.1)', borderColor: 'rgba(232, 115, 79, 0.2)' }}
                  >
                    شاور سراج قبل الطلب
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'تمويل جديد' && selectedProduct && !submitted && (
        <div className="fin-form-card">
          <p className="fin-form-title">
            تقديم طلب: {selectedProduct.name}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            الحد الأدنى: {selectedProduct.min_amount.toLocaleString()} ر.س | الحد الأقصى: {selectedProduct.max_amount.toLocaleString()} ر.س
            <br />
            فترة السداد: {selectedProduct.min_term_months} - {selectedProduct.max_term_months} شهر
          </p>
          
          <div className="input-group">
            <label className="input-label">المبلغ المطلوب (ر.س)</label>
            <input
              type="number"
              className="input-field"
              placeholder={`مثال: ${selectedProduct.min_amount}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">مدة السداد (شهر)</label>
            <input
              type="number"
              className="input-field"
              placeholder={`مثال: ${selectedProduct.max_term_months}`}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">ملاحظات إضافية (اختياري)</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: شراء مستلزمات تأثيث"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <div className="fin-form-actions">
            <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
              رجوع
            </button>
            <button className="btn btn-primary fin-submit-btn" onClick={handleSubmit}>
              إرسال الطلب
            </button>
          </div>
        </div>
      )}

      {tab === 'تمويل جديد' && submitted && (
        <div className="fin-success-card">
          <CheckCircle2 size={36} color="#16a34a" />
          <p>تم إرسال طلبك بنجاح، راح تقدر تتابعه من "متابعة الطلبات"</p>
        </div>
      )}

      {tab === 'متابعة الطلبات' && (
        <div className="fin-requests-list">
          {activeRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              لا توجد طلبات تمويل نشطة حالياً.
            </div>
          ) : (
            activeRequests.map((r) => {
              const productName = products.find(p => p.product_type === r.product_type)?.name || r.product_type;
              const statusIdx = getStatusIndex(r.status);
              return (
                <div key={r.id} className="fin-request-card">
                  <div className="fin-request-header">
                    <span className="fin-request-type">{productName}</span>
                    <span className="fin-request-amount">{r.amount.toLocaleString()} ر.س</span>
                  </div>
                  <div className="fin-status-track">
                    {statusSteps.map((step, i) => (
                      <div key={step} className={`fin-status-step ${i <= statusIdx ? 'done' : ''}`}>
                        <div className="fin-status-dot" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <p className="fin-request-date">
                    <Clock size={12} /> السداد على {r.term_months} شهر | {r.notes}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'سجل التمويل' && (
        <div className="fin-history-list">
          {historicRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              سجل التمويل فارغ.
            </div>
          ) : (
            historicRequests.map((h) => {
              const productName = products.find(p => p.product_type === h.product_type)?.name || h.product_type;
              const isApproved = h.status === 'approved';
              return (
                <div key={h.id} className="fin-history-item">
                  <div className="fin-history-icon">
                    {isApproved ? (
                      <CheckCircle2 size={16} color="#16a34a" />
                    ) : (
                      <XCircle size={16} color="#dc2626" />
                    )}
                  </div>
                  <div className="fin-history-info">
                    <p className="fin-history-type">{productName}</p>
                    <p className="fin-history-date">{getStatusLabel(h.status)} — السداد على {h.term_months} شهر</p>
                  </div>
                  <p className="fin-history-amount">{h.amount.toLocaleString()} ر.س</p>
                  <ChevronLeft size={14} color="var(--text-secondary)" />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}