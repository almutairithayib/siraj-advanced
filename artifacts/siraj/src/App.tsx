import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AlertsProvider } from './context/AlertsContext';
import AppLayout from './components/Layout/AppLayout';
import { SavingsProvider } from './context/SavingsContext';
import { GoalsProvider } from './context/GoalsContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import SirajAIPage from './pages/SirajAIPage';
import FinancingPage from './pages/FinancingPage';
import InvestmentPage from './pages/InvestmentPage';
import SavingsPage from './pages/SavingsPage';
import GoalsPage from './pages/GoalsPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SecurityPage from './pages/SecurityPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertsProvider>
          <GoalsProvider>
            <SavingsProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Login Route */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Secure App Layout Sub-Routes */}
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="siraj-ai" element={<SirajAIPage />} />
                    <Route path="financing" element={<FinancingPage />} />
                    <Route path="investment" element={<InvestmentPage />} />
                    <Route path="savings" element={<SavingsPage />} />
                    <Route path="goals" element={<GoalsPage />} />
                    <Route path="alerts" element={<AlertsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="security" element={<SecurityPage />} />
                  </Route>

                  {/* Catch-all Redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </SavingsProvider>
          </GoalsProvider>
        </AlertsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
