import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        direction: 'rtl',
        fontFamily: 'Cairo',
        color: 'var(--text-primary)'
      }}>
        جاري تحميل البيانات...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout-wrapper" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100dvh'
    }}>
      <div className="mobile-viewport" style={{
        width: '100%',
        maxWidth: '430px',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
  paddingTop: 'env(safe-area-inset-top, 0px)'

      }}>
        <TopBar />
        <main className="page-content-wrapper" style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '90px', /* هذه المساحة لكي لا يختفي زر سراج تحت الـ BottomNav */
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;