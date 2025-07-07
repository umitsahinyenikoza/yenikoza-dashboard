import { debugLog, debugError } from "../utils/debug.js";
import React from 'react';
import { BarChart3, Store, MessageSquare, AlertTriangle, Home, LogOut, User, Shield } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = ({ children, activeSection = 'overview', onSectionChange, user, onLogout }) => {
  const sidebarItems = [
    { id: 'overview', label: 'Genel Bakış', icon: Home },
    { id: 'customer-analytics', label: 'Müşteri Analitik', icon: Store },
    { id: 'sms', label: 'SMS Takip', icon: MessageSquare },
    { id: 'errors', label: 'Hata Logları', icon: AlertTriangle },
    { id: 'reports', label: 'Raporlar', icon: BarChart3 },
    { id: 'settings', label: 'Ayarlar', icon: Shield }
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return '#dc2626';
      case 'Manager': return '#059669';
      case 'Analyst': return '#2563eb';
      case 'Viewer': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Administrator': return '👑';
      case 'Manager': return '🎯';
      case 'Analyst': return '📊';
      case 'Viewer': return '👁️';
      default: return '👤';
    }
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      onLogout();
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="header-title">YeniKoza Tablet Monitoring</h1>
          <span className="header-subtitle">Real-time Dashboard</span>
        </div>
        <div className="header-right">
          {user && (
            <>
              <div className="user-greeting">
                Hoşgeldin, <span className="user-name-display">{user.name || user.username}</span>
              </div>
              <button 
                className="logout-button-simple" 
                onClick={handleLogout}
                title="Çıkış Yap"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    debugLog('Sidebar item clicked:', item.id);
                    if (onSectionChange) {
                      onSectionChange(item.id);
                    }
                    window.location.hash = item.id;
                  }}
                >
                  <span className="sidebar-icon">
                    {item.id === 'overview' ? '🏠' : 
                     item.id === 'customer-analytics' ? '🏪' :
                     item.id === 'sms' ? '📱' : 
                     item.id === 'errors' ? '⚠️' :
                     item.id === 'reports' ? '📄' :
                     item.id === 'settings' ? '⚙️' :
                     '🏠'}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 