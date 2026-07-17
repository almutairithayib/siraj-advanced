import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useAlerts from '../../hooks/useAlerts';
import { LogOut, Bell } from 'lucide-react';

const TopBar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useAlerts();
  const navigate = useNavigate();

  const displayName = user?.full_name || 'سارة المطيري';
  const displayAvatar = displayName.charAt(0) || 'س';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-actions">
        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">
            {displayAvatar}
          </div>
          <span className="user-name">{displayName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Notification Bell */}
          <div 
            onClick={() => navigate('/alerts')}
            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            aria-label="التنبيهات"
          >
            <Bell size={22} color="var(--text-primary)" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-color)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
            aria-label="تسجيل الخروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;