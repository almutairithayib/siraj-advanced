import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import logo from '../assets/LOGO-SIRAJ.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات المدخلة.');
    }
  };

  return (
    <div className="app-layout-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <div className="mobile-viewport" style={{ width: '100%', maxWidth: '430px', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo-box">
                <img src={logo} alt="سراج" className="login-logo-img" />
              </div>
              <h1 className="login-title">سراج</h1>
              <p className="login-subtitle">منصة المستشار المالي الذكي</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label className="input-label" htmlFor="email">البريد الإلكتروني</label>
                <div className="input-with-icon">
                  <input
                    className="input-field"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@siraj.sa"
                    required
                  />
                  <Mail size={17} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label className="input-label" htmlFor="password">كلمة المرور</label>
                  <button type="button" className="forgot-password-link">نسيت كلمة المرور؟</button>
                </div>
                <div className="input-with-icon">
                  <input
                    className="input-field"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                 
                  <Lock size={16} className="input-icon-lock" />
                </div>
              </div>

              <label className="remember-me-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="remember-me-checkbox"
                />
                <span>تذكرني على هذا الجهاز</span>
              </label>

              <button className="btn btn-primary login-btn" type="submit" disabled={isLoading}>
                {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className="login-offline-note">
              للتجربة والتقييم، يرجى استخدام بيانات الدخول التالية:
              <br />
              البريد: <span className="login-offline-email" style={{ userSelect: 'all', marginLeft: '10px' }}>sara@siraj.sa</span>
              <br />
              الرمز: <span className="login-offline-email" style={{ userSelect: 'all' }}>12345678</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;