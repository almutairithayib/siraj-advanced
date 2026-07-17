import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, Lock, LogOut, ChevronLeft, Shield, HelpCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || 'محمد العنزي';
  const displayEmail = user?.email || 'sara@siraj.sa';

  return (
    <div className="fin-page">
      <h1 className="page-title">الإعدادات</h1>

      {/* Profile */}
      <div className="settings-profile-card">
        <div className="settings-avatar">{displayName.charAt(0)}</div>
        <div className="settings-profile-info">
          <p className="settings-profile-name">{displayName}</p>
          <p className="settings-profile-email">{displayEmail}</p>
        </div>
        <button className="settings-edit-btn">تعديل</button>
      </div>

      {/* Preferences */}
      <p className="settings-section-label">التفضيلات</p>
      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-icon">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <span>الوضع الليلي</span>
          </div>
          <button
            className={`settings-toggle ${theme === 'dark' ? 'on' : ''}`}
            onClick={toggleTheme}
          >
            <span className="settings-toggle-dot" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-icon">
              <Bell size={16} />
            </div>
            <span>الإشعارات</span>
          </div>
          <button
            className={`settings-toggle ${notifications ? 'on' : ''}`}
            onClick={() => setNotifications(!notifications)}
          >
            <span className="settings-toggle-dot" />
          </button>
        </div>
      </div>

      {/* Account */}
      <p className="settings-section-label">الحساب</p>
      <div className="settings-group">
        <button className="settings-row settings-row-link">
          <div className="settings-row-info">
            <div className="settings-row-icon">
              <Lock size={16} />
            </div>
            <span>تغيير كلمة المرور</span>
          </div>
          <ChevronLeft size={16} color="var(--text-secondary)" />
        </button>

        <button className="settings-row settings-row-link">
          <div className="settings-row-info">
            <div className="settings-row-icon">
              <Shield size={16} />
            </div>
            <span>الخصوصية والأمان</span>
          </div>
          <ChevronLeft size={16} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Support */}
      <p className="settings-section-label">الدعم</p>
      <div className="settings-group">
        <button className="settings-row settings-row-link">
          <div className="settings-row-info">
            <div className="settings-row-icon">
              <HelpCircle size={16} />
            </div>
            <span>مركز المساعدة</span>
          </div>
          <ChevronLeft size={16} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Logout */}
      <button className="settings-logout-btn" onClick={handleLogout}>
        <LogOut size={16} /> تسجيل الخروج
      </button>

      <p className="settings-version">سراج · الإصدار 1.0.0</p>
    </div>
  );
}