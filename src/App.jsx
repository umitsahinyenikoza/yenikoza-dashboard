import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Overview from './components/Overview';
import CustomerAnalytics from './components/CustomerAnalytics';
import SMSTracking from './components/SMSTracking';
import ErrorLogs from './components/ErrorLogs';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import authAPI from './services/authAPI';
import './App.css';
import { HashRouter } from 'react-router-dom';
import { debugLog } from './utils/debug.js';

function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = authAPI.getStoredToken();
        const storedUser = authAPI.getStoredUser();
        
        if (storedToken && storedUser) {
          // Validate token
          if (authAPI.isTokenValid(storedToken)) {
            // Try to get fresh user data from backend
            try {
              const freshUserData = await authAPI.getCurrentUser(storedToken);
              setUser(freshUserData);
              setIsAuthenticated(true);
              debugLog('✅ Session restored from token');
            } catch (error) {
              debugLog('⚠️ Token validation failed, clearing session');
              authAPI.clearSession();
            }
          } else {
            debugLog('⚠️ Token expired, clearing session');
            authAPI.clearSession();
          }
        }
      } catch (error) {
        debugLog('Session check error:', error);
        authAPI.clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    debugLog(`✅ User ${userData.username} logged in successfully`);
  };

  const handleLogout = async () => {
    try {
      const token = authAPI.getStoredToken();
      if (token) {
        try {
          await authAPI.logout(token);
        } catch (error) {
          debugLog('Logout API call failed, but clearing local session anyway');
        }
      }
    } catch (error) {
      debugLog('Logout error:', error);
    } finally {
      // Always clear local session
      authAPI.clearSession();
      setUser(null);
      setIsAuthenticated(false);
      setActiveSection('overview'); // Reset to default section
      debugLog('🚪 User logged out');
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Real-time update simulation
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      // Bu kısım gerçek API entegrasyonu için kullanılabilir
      // console.log('Dashboard data updated');
    }, 30000); // 30 saniyede bir güncelle

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // İlk yüklemede URL hash'ini kontrol et ve hash değişikliklerini dinle
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && hash !== activeSection) {
        setActiveSection(hash);
      }
    };

    // İlk yüklemede kontrol et
    handleHashChange();

    // Hash değişikliklerini dinle
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAuthenticated, activeSection]);

  // Session expiration check
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkSessionExpiration = () => {
      const token = authAPI.getStoredToken();
      if (!token || !authAPI.isTokenValid(token)) {
        debugLog('⏰ Session expired, logging out');
        handleLogout();
      }
    };

    // Check every 5 minutes
    const expirationCheck = setInterval(checkSessionExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(expirationCheck);
  }, [isAuthenticated, user]);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'customer-analytics':
        return <CustomerAnalytics />;
      case 'sms':
        return <SMSTracking />;
      case 'errors':
        return <ErrorLogs />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Dashboard yükleniyor...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show dashboard if authenticated
  return (
    <HashRouter>
      <div className="App">
        <DashboardLayout 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          user={user}
          onLogout={handleLogout}
        >
          {renderContent()}
        </DashboardLayout>
      </div>
    </HashRouter>
  );
}

export default App;
