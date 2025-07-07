import { debugLog, debugError } from "../utils/debug.js";
import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, WifiOff, Clock, Users, AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { storesAPI } from '../services/storesAPI';
import './Stores.css';
import { formatLastSeen } from '../utils/timeUtils.js';

const StoreCard = ({ store, storeStatus }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Wifi size={16} />;
      case 'error': return <WifiOff size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
          <p className="text-sm text-gray-500 font-mono">{store.code}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(storeStatus?.status || store.status)}`}>
          {getStatusIcon(storeStatus?.status || store.status)}
          {storeStatus?.isActive ? 'Aktif' : 'Offline'}
        </div>
      </div>

      <div className="flex items-start gap-2 mb-4">
        <MapPin size={16} className="text-gray-400 mt-1 flex-shrink-0" />
        <p className="text-sm text-gray-600">{store.address}</p>
      </div>

      {storeStatus && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={14} className="text-blue-600" />
              <span className="text-xs text-gray-500">Bugün</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{storeStatus.todayCustomers}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-xs text-gray-500">Hata</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{storeStatus.errorCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={14} className="text-green-600" />
              <span className="text-xs text-gray-500">Son</span>
            </div>
            <p className="text-xs font-medium text-gray-900">
              {formatLastSeen(Math.floor((new Date() - new Date(storeStatus.lastActivity)) / 60000))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [storeStatus, setStoreStatus] = useState([]);
  const [storeSummary, setStoreSummary] = useState({
    total: 0,
    active: 0,
    offline: 0,
    warning: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    loadStoreData();
    
    // 🔄 Real-time updates - Her 60 saniyede bir store durumlarını güncelle
    const interval = setInterval(() => {
      loadStoreDataSilently(); // Background refresh
    }, 60000); // 60 saniye (store data için)
    
    return () => clearInterval(interval);
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all store data in parallel
      const [storesData, statusData, summaryData] = await Promise.all([
        storesAPI.getStores(),
        storesAPI.getStoreStatus(),
        storesAPI.getStoreSummary()
      ]);

      setStores(storesData || []);
      setStoreStatus(statusData || []);
      setStoreSummary(summaryData || storeSummary);
      setLastUpdateTime(new Date()); // ⏰ Son güncelleme zamanını kaydet
    } catch (err) {
      debugError('Error loading store data:', err);
      setError('Mağaza verileri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // 🔇 Sessiz veri yükleme (loading indicator'sız) - Real-time updates için
  const loadStoreDataSilently = async () => {
    try {
      setIsAutoRefreshing(true);
      
      // Load all store data in parallel
      const [storesData, statusData, summaryData] = await Promise.all([
        storesAPI.getStores(),
        storesAPI.getStoreStatus(),
        storesAPI.getStoreSummary()
      ]);

      setStores(storesData || []);
      setStoreStatus(statusData || []);
      setStoreSummary(summaryData || storeSummary);
      setLastUpdateTime(new Date());
      setError(null); // Clear any previous errors
      
      debugLog('🔄 Stores auto-refreshed:', new Date().toLocaleTimeString('tr-TR'));
      
    } catch (err) {
      debugError('Auto-refresh error (silent):', err);
      // Don't show error to user for background refresh
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadStoreData();
    } catch (err) {
      debugError('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getStoreStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'active';
      case 'warning': return 'warning';
      case 'error': case 'offline': return 'error';
      default: return 'offline';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <TrendingUp className="status-icon success" size={20} />;
      case 'warning': return <AlertTriangle className="status-icon warning" size={20} />;
      case 'error': case 'offline': return <TrendingDown className="status-icon error" size={20} />;
      default: return <AlertTriangle className="status-icon error" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin" size={48} />
            <p className="text-gray-600">Mağaza verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Hata</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            style={{
              fontSize: '0.875rem',
              opacity: 0.9,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#374151',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.15)';
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stores page-container">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Mağaza Yönetimi</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p className="page-subtitle">Tüm mağazaların durumu ve performans bilgileri</p>
              {/* 🔄 Real-time Status Indicator */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isAutoRefreshing ? '#f59e0b' : '#10b981',
                  animation: isAutoRefreshing ? 'pulse 2s infinite' : 'none'
                }}></div>
                <span>
                  {isAutoRefreshing ? 'Güncelleniyor...' : 'Canlı'}
                </span>
                {lastUpdateTime && (
                  <span>
                    • Son: {lastUpdateTime.toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              fontSize: '0.875rem',
              opacity: refreshing ? 0.7 : 0.9,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#374151',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              if (!refreshing) {
                e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.1)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="content-section">
        <div className="summary-container">
          <div className="summary-header">
            <h2 className="summary-title">Mağaza Özeti</h2>
          </div>
          <div className="summary-grid">
            <div className="summary-item total">
              <div className="summary-value total">{storeSummary.total}</div>
              <div className="summary-label">Toplam Mağaza</div>
            </div>
            <div className="summary-item active">
              <div className="summary-value active">{storeSummary.active}</div>
              <div className="summary-label">Aktif</div>
            </div>
            <div className="summary-item warning">
              <div className="summary-value warning">{storeSummary.warning}</div>
              <div className="summary-label">Uyarı</div>
            </div>
            <div className="summary-item error">
              <div className="summary-value error">{storeSummary.offline}</div>
              <div className="summary-label">Çevrimdışı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Cards */}
      <div className="content-section">
        <div className="stores-grid">
          {stores.map((store) => {
            const storeStatusData = storeStatus.find(s => s.storeCode === store.code) || {};
            const statusClass = getStoreStatusClass(storeStatusData.status);
            
            return (
              <div key={store.id} className={`store-card ${statusClass}`}>
                <div className="store-header">
                  <div className="store-info">
                    <h3>{store.name}</h3>
                    <div className="store-code">{store.code}</div>
                  </div>
                  <div className="status-badge">
                    {getStatusIcon(storeStatusData.status)}
                    <span>{storeStatusData.status || 'Bilinmiyor'}</span>
                  </div>
                </div>

                <div className="store-address">
                  <MapPin className="location-icon" size={16} />
                  <p>{store.address}</p>
                </div>

                <div className="store-metrics">
                  <div className="store-metric">
                    <div className="metric-header">
                      <Users className="metric-icon" size={14} />
                      <span className="metric-label">Müşteri</span>
                    </div>
                    <div className="metric-value customers">
                      {storeStatusData.customerCount || 0}
                    </div>
                  </div>
                  
                  <div className="store-metric">
                    <div className="metric-header">
                      <AlertTriangle className="metric-icon" size={14} />
                      <span className="metric-label">Hata</span>
                    </div>
                    <div className="metric-value errors">
                      {storeStatusData.errorCount || 0}
                    </div>
                  </div>
                  
                  <div className="store-metric">
                    <div className="metric-header">
                      <Clock className="metric-icon" size={14} />
                      <span className="metric-label">Son İşlem</span>
                    </div>
                    <div className="metric-value time">
                      {storeStatusData.lastActivity ? 
                        new Date(storeStatusData.lastActivity).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 
                        '--:--'
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Henüz mağaza kaydı bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores; 