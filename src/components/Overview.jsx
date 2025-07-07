import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingBag, AlertTriangle, CheckCircle, Clock, RefreshCw, Wifi, WifiOff, Calendar, ChevronDown } from 'lucide-react';
import { dashboardAPI } from '../services/dashboardAPI';
import './Overview.css';
import { useNavigate } from 'react-router-dom';
import { debugLog } from '../utils/debug.js';
import { formatLastSeen } from '../utils/timeUtils.js';

const Overview = () => {
  const [overviewData, setOverviewData] = useState({
    metrics: {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      systemHealth: 0,
      activeStores: 0,
      pendingApprovals: 0
    },
    storeStatus: [],
    alerts: [],
    activities: [],
    trends: {
      usersChange: 0,
      ordersChange: 0,
      revenueChange: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [expandedStore, setExpandedStore] = useState(null); // 📱 Detay görünümü için
  const [dateScope, setDateScope] = useState('gunluk'); // Tarih aralığı seçimi: gunluk, aylik, yillik
  const navigate = useNavigate();

  useEffect(() => {
    loadOverviewData();
    
    // 🔄 Real-time updates - Her 30 saniyede bir data'yı güncelle
    const interval = setInterval(() => {
      loadOverviewDataSilently(); // Background refresh
    }, 30000); // 30 saniye
    
    return () => clearInterval(interval);
  }, [dateScope]); // dateScope değiştiğinde yeniden yükle

  // 🔇 Sessiz veri yükleme (loading indicator'sız)
  const loadOverviewDataSilently = async () => {
    try {
      setIsAutoRefreshing(true);
      
      // Load all overview data in parallel with date scope
      const [overviewData, alerts, activities] = await Promise.all([
        dashboardAPI.getOverviewData(dateScope).catch(() => ({ metrics: {}, trends: {} })),
        dashboardAPI.getAlerts(dateScope).catch(() => []),
        dashboardAPI.getRecentActivities(dateScope).catch(() => [])
      ]);

      debugLog('🔍 Raw overviewData:', overviewData);
      debugLog('🔍 overviewData.overview:', overviewData?.overview);
      debugLog('🔍 activeTablets:', overviewData?.overview?.activeTablets);
      debugLog('🔍 todayLogs:', overviewData?.overview?.todayLogs);
      debugLog('🔍 successCount:', overviewData?.overview?.successCount);
      debugLog('🔍 successRate:', overviewData?.overview?.successRate);
      debugLog('🔍 errorCount:', overviewData?.overview?.errorCount);
      debugLog('🔍 overviewData.stores:', overviewData?.stores);
      debugLog('🔍 stores length:', overviewData?.stores?.length);
      debugLog('🔍 First store data:', overviewData?.stores?.[0]);
      debugLog('🔍 Store keys:', overviewData?.stores?.[0] ? Object.keys(overviewData.stores[0]) : 'No stores');

      // Mağaza durumları verisini overviewData.stores'dan al
      const storeStatus = overviewData?.stores || [];

      // Aktif mağaza sayısını hesapla - sadece gerçek mağaza seçimi yapılmış olanları say
      const activeStoresCount = storeStatus.filter(store => 
        store.status === 'active' && 
        store.storeCode && 
        store.storeName && 
        store.storeCode !== 'UNKNOWN' && 
        store.storeName !== 'UNKNOWN'
      ).length;

      debugLog('🔍 activeStoresCount:', activeStoresCount);

      const metrics = {
        totalUsers: overviewData.overview?.activeTablets || 0,
        totalOrders: overviewData.overview?.totalLogs || 0,
        totalRevenue: overviewData.overview?.successCount || 0,
        systemHealth: Math.round(overviewData.overview?.successRate || 0),
        activeStores: activeStoresCount,
        pendingApprovals: overviewData.overview?.errorCount || 0
      };

      debugLog('🔍 Final metrics:', metrics);

      // ✅ TREND HESAPLAMA: Backend'den gelen trend verilerini manuel hesapla
      const trendData = overviewData.trends || [];
      let trends = {
        usersChange: 0,
        ordersChange: 0,
        revenueChange: 0
      };
      
      if (Array.isArray(trendData) && trendData.length >= 2) {
        const today = trendData[trendData.length - 1];
        const yesterday = trendData[trendData.length - 2];
        
        // Aktif tablet değişimi
        if (yesterday.activeTablets === 0) {
          trends.usersChange = today.activeTablets > 0 ? 100 : 0;
        } else {
          trends.usersChange = ((today.activeTablets - yesterday.activeTablets) / yesterday.activeTablets) * 100;
        }
        
        // Log sayısı değişimi
        if (yesterday.total === 0) {
          trends.ordersChange = today.total > 0 ? 100 : 0;
        } else {
          trends.ordersChange = ((today.total - yesterday.total) / yesterday.total) * 100;
        }
        
        // Başarı oranı değişimi
        const todaySuccessRate = today.total > 0 ? (today.success / today.total) * 100 : 0;
        const yesterdaySuccessRate = yesterday.total > 0 ? (yesterday.success / yesterday.total) * 100 : 0;
        trends.revenueChange = todaySuccessRate - yesterdaySuccessRate;
      }
      
      setOverviewData({
        metrics: metrics,
        storeStatus: storeStatus,
        alerts: alerts,
        activities: activities,
        trends: trends
      });
      
      setLastUpdateTime(new Date());
      setError(null); // Clear any previous errors
      
      debugLog('🔄 Dashboard auto-refreshed:', new Date().toLocaleTimeString('tr-TR'));
      
    } catch (err) {
      debugError('Auto-refresh error (silent):', err);
      // Don't show error to user for background refresh
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all overview data in parallel with date scope
      const [overviewData, alerts, activities] = await Promise.all([
        dashboardAPI.getOverviewData(dateScope).catch(() => ({ metrics: {}, trends: {} })),
        dashboardAPI.getAlerts(dateScope).catch(() => []),
        dashboardAPI.getRecentActivities(dateScope).catch(() => [])
      ]);

      debugLog('🔍 Raw overviewData:', overviewData);
      debugLog('🔍 overviewData.overview:', overviewData?.overview);
      debugLog('🔍 activeTablets:', overviewData?.overview?.activeTablets);
      debugLog('🔍 todayLogs:', overviewData?.overview?.todayLogs);
      debugLog('🔍 successCount:', overviewData?.overview?.successCount);
      debugLog('🔍 successRate:', overviewData?.overview?.successRate);
      debugLog('🔍 errorCount:', overviewData?.overview?.errorCount);
      debugLog('🔍 overviewData.stores:', overviewData?.stores);
      debugLog('🔍 stores length:', overviewData?.stores?.length);
      debugLog('🔍 First store data:', overviewData?.stores?.[0]);
      debugLog('🔍 Store keys:', overviewData?.stores?.[0] ? Object.keys(overviewData.stores[0]) : 'No stores');

      // Mağaza durumları verisini overviewData.stores'dan al
      const storeStatus = overviewData?.stores || [];

      // Aktif mağaza sayısını hesapla - sadece gerçek mağaza seçimi yapılmış olanları say
      const activeStoresCount = storeStatus.filter(store => 
        store.status === 'active' && 
        store.storeCode && 
        store.storeName && 
        store.storeCode !== 'UNKNOWN' && 
        store.storeName !== 'UNKNOWN'
      ).length;

      debugLog('🔍 activeStoresCount:', activeStoresCount);

      const metrics = {
        totalUsers: overviewData.overview?.activeTablets || 0,
        totalOrders: overviewData.overview?.totalLogs || 0,
        totalRevenue: overviewData.overview?.successCount || 0,
        systemHealth: Math.round(overviewData.overview?.successRate || 0),
        activeStores: activeStoresCount,
        pendingApprovals: overviewData.overview?.errorCount || 0
      };

      debugLog('🔍 Final metrics:', metrics);

      // ✅ TREND HESAPLAMA: Backend'den gelen trend verilerini manuel hesapla
      const trendData = overviewData.trends || [];
      let trends = {
        usersChange: 0,
        ordersChange: 0,
        revenueChange: 0
      };
      
      if (Array.isArray(trendData) && trendData.length >= 2) {
        const today = trendData[trendData.length - 1];
        const yesterday = trendData[trendData.length - 2];
        
        // Aktif tablet değişimi
        if (yesterday.activeTablets === 0) {
          trends.usersChange = today.activeTablets > 0 ? 100 : 0;
        } else {
          trends.usersChange = ((today.activeTablets - yesterday.activeTablets) / yesterday.activeTablets) * 100;
        }
        
        // Log sayısı değişimi
        if (yesterday.total === 0) {
          trends.ordersChange = today.total > 0 ? 100 : 0;
        } else {
          trends.ordersChange = ((today.total - yesterday.total) / yesterday.total) * 100;
        }
        
        // Başarı oranı değişimi
        const todaySuccessRate = today.total > 0 ? (today.success / today.total) * 100 : 0;
        const yesterdaySuccessRate = yesterday.total > 0 ? (yesterday.success / yesterday.total) * 100 : 0;
        trends.revenueChange = todaySuccessRate - yesterdaySuccessRate;
      }
      
      setOverviewData({
        metrics: metrics,
        storeStatus: storeStatus,
        alerts: alerts,
        activities: activities,
        trends: trends
      });
      
      setLastUpdateTime(new Date()); // ⏰ Son güncelleme zamanını kaydet
    } catch (err) {
      debugError('Error loading overview data:', err);
      setError('Dashboard verileri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadOverviewData();
    } catch (err) {
      debugError('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAlertAsRead = async (alertId) => {
    try {
      await dashboardAPI.markAlertAsRead(alertId);
      // Update local state
      setOverviewData(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.id !== alertId)
      }));
    } catch (err) {
      debugError('Error marking alert as read:', err);
    }
  };

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="metric-trend positive" size={16} />;
    if (change < 0) return <TrendingDown className="metric-trend negative" size={16} />;
    return null;
  };

  const formatTrendValue = (change) => {
    // ✅ NaN kontrolü ekle
    if (isNaN(change) || change === null || change === undefined) {
      return '0%';
    }
    const absChange = Math.abs(change);
    return `${change > 0 ? '+' : ''}${absChange.toFixed(1)}%`;
  };

  const getStoreStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <Wifi className="status-icon success" size={16} />;
      case 'inactive': case 'offline': case 'warning': return <WifiOff className="status-icon error" size={16} />;
      case 'error': return <AlertTriangle className="status-icon error" size={16} />;
      default: return <WifiOff className="status-icon error" size={16} />;
    }
  };

  const getAlertIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'critical': return <AlertTriangle className="alert-icon critical" size={16} />;
      case 'warning': return <AlertTriangle className="alert-icon warning" size={16} />;
      case 'error': return <AlertTriangle className="alert-icon error" size={16} />;
      default: return <AlertTriangle className="alert-icon warning" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin" size={48} />
            <p className="text-gray-600">Dashboard verileri yükleniyor...</p>
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
            <RefreshCw size={16} />
            <span>Tekrar Dene</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overview">
      <div className="overview-header">
        <div className="flex justify-between items-start">
          <div>
            <h2>Genel Bakış</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p>YeniKoza tablet sistemi durumu ve temel metrikler</p>
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
          
          {/* Tarih Aralığı Seçimi */}
          <div className="flex gap-2">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem'
            }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Calendar size={16} style={{ 
                  color: '#3b82f6',
                  position: 'absolute',
                  left: '12px',
                  zIndex: 1
                }} />
                <select
                  value={dateScope}
                  onChange={(e) => setDateScope(e.target.value)}
                  className="appearance-none rounded-lg px-3 py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  style={{
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    paddingLeft: '2.5rem',
                    paddingRight: '2rem'
                  }}
                                >
                  <option value="gunluk">Günlük</option>
                  <option value="aylik">Aylık</option>
                  <option value="yillik">Yıllık</option>
                </select>
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
              <span>Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card blue">
          <div className="metric-header">
            <div className="metric-icon">
              <Users size={24} />
            </div>
            {overviewData.trends.usersChange !== 0 && (
              <div className={`metric-trend ${overviewData.trends.usersChange > 0 ? 'positive' : 'negative'}`}>
                {getTrendIcon(overviewData.trends.usersChange)}
                {formatTrendValue(overviewData.trends.usersChange)}
              </div>
            )}
          </div>
          <div className="metric-content">
            <h3>{overviewData.metrics.totalUsers}</h3>
            <div className="metric-title">Aktif Tablet</div>
            <div className="metric-subtitle">Bağlı tablet sayısı</div>
          </div>
        </div>

        <div
          className="metric-card green clickable"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            // App.jsx'te section değişikliği yap
            window.location.hash = '#errors';
          }}
        >
          <div className="metric-header">
            <div className="metric-icon">
              <ShoppingBag size={24} />
            </div>
            {overviewData.trends.ordersChange !== 0 && (
              <div className={`metric-trend ${overviewData.trends.ordersChange > 0 ? 'positive' : 'negative'}`}>
                {getTrendIcon(overviewData.trends.ordersChange)}
                {formatTrendValue(overviewData.trends.ordersChange)}
              </div>
            )}
          </div>
          <div className="metric-content">
            <h3>{overviewData.metrics.totalOrders}</h3>
            <div className="metric-title">
              {dateScope === 'gunluk' ? 'Bugünkü Log' : 
               dateScope === 'aylik' ? 'Aylık Log' : 'Yıllık Log'}
            </div>
            <div className="metric-subtitle">
              {dateScope === 'gunluk' ? 'Bugün kaydedilen' : 
               dateScope === 'aylik' ? 'Bu ay kaydedilen' : 'Bu yıl kaydedilen'}
            </div>
          </div>
        </div>

        <div className="metric-card orange">
          <div className="metric-header">
            <div className="metric-icon">
              <CheckCircle size={24} />
            </div>
          </div>
                     <div className="metric-content">
             <h3>{overviewData.metrics.systemHealth > 0 ? `${overviewData.metrics.systemHealth}%` : 'Veri yok'}</h3>
             <div className="metric-title">Başarı Oranı</div>
             <div className="metric-subtitle">Genel başarı oranı</div>
           </div>
        </div>

        <div className="metric-card teal">
          <div className="metric-header">
            <div className="metric-icon">
              <Users size={24} />
            </div>
          </div>
          <div className="metric-content">
            <h3>{overviewData.metrics.activeStores}</h3>
            <div className="metric-title">Aktif Mağaza</div>
            <div className="metric-subtitle">Çalışan mağazalar</div>
          </div>
        </div>

        <div className="metric-card red">
          <div className="metric-header">
            <div className="metric-icon">
              <Clock size={24} />
            </div>
          </div>
          <div className="metric-content">
            <h3>{overviewData.metrics.pendingApprovals}</h3>
            <div className="metric-title">Aktif Hata</div>
            <div className="metric-subtitle">Çözüm bekleyen</div>
          </div>
        </div>
      </div>

      {/* Overview Content */}
      <div className="overview-content">
        {/* Store Status */}
        <div className="overview-section">
          <h2 className="section-title">
            Mağaza Durumları 
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal', marginLeft: '0.5rem' }}>
              ({dateScope === 'gunluk' ? 'Bugün' : dateScope === 'aylik' ? 'Bu Ay' : 'Bu Yıl'})
            </span>
          </h2>
          <div className="stores-grid">
            {overviewData.storeStatus.map((store, index) => (
              <div key={store.id || index} className={`store-card ${store.status} ${expandedStore === store.id ? 'expanded' : ''}`}>
                <div 
                  className="store-header clickable"
                  onClick={() => setExpandedStore(expandedStore === store.id ? null : store.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="store-name">{store.storeName}</div>
                    <div className="store-code">{store.storeCode}</div>
                  </div>
                  <div className={`status-container ${(store.onlineTablets || 0) > 0 ? 'status-online' : 'status-offline'}`}>
                    {getStoreStatusIcon((store.onlineTablets || 0) > 0 ? 'active' : 'inactive')}
                    <div className="status-info">
                      <span className="status-text">
                        {(store.onlineTablets || 0) > 0 ? 'Online' : 'Offline'}
                      </span>
                      {/* 📱 Tablet durum bilgisi */}
                      {store.totalTablets && (
                        <div className="tablet-status">
                          <span className="tablet-count">
                            {store.onlineTablets || 0}/{store.totalTablets} tablet
                          </span>
                          <span className="expand-indicator">
                            {expandedStore === store.id ? '📤' : '📥'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 📱 Tablet Detayları - Expandable */}
                {expandedStore === store.id && store.tabletDetails && store.tabletDetails.length > 0 && (
                  <div className="tablet-details">
                    <div className="tablet-details-header">
                      <h4>📱 Tablet Detayları</h4>
                    </div>
                    <div className="tablet-list">
                      {store.tabletDetails.map((tablet, idx) => (
                        <div key={idx} className={`tablet-item ${tablet.isOnline ? 'online' : 'offline'}`}>
                          <div className="tablet-info">
                            <span className="tablet-icon">{tablet.statusIcon}</span>
                            <div className="tablet-id">
                              <div className="device-info">
                                <strong>Device:</strong> {tablet.deviceId || 'Unknown'}
                                {tablet.isUnknownDevice && (
                                  <span className="unknown-device-warning"> ⚠️ ID Eksik</span>
                                )}
                                {tablet.isMultiStore && (
                                  <span className="multi-store-indicator"> 🔄 Multi-Store</span>
                                )}
                              </div>
                              <div className="store-info">
                                <span className="store-indicator"> 
                                  {tablet.isOnline ? 'Aktif kullanan mağaza' : 'Son kullanıldığı mağaza'}: {tablet.currentStore}
                                </span>
                              </div>
                            </div>
                            <div className="tablet-status-text">
                              <strong>Durum:</strong> {tablet.statusText}
                              {tablet.isMultiStore && (
                                <div className="store-history">
                                  <strong>Kullanıldığı mağazalar:</strong> {tablet.storeHistory?.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="tablet-activity">
                            <div className="last-seen">
                              <strong>Son Görülme:</strong> {formatLastSeen(tablet.lastSeenMinutes)}
                            </div>
                            <div className="log-count">
                              <strong>Bu Mağaza:</strong> {tablet.logCount} log
                              {tablet.totalLogCount && tablet.totalLogCount !== tablet.logCount && (
                                <div className="total-log-count">
                                  <strong>Toplam:</strong> {tablet.totalLogCount} log
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {expandedStore === store.id && (!store.tabletDetails || store.tabletDetails.length === 0) && (
                  <div className="tablet-details">
                    <p className="no-tablets">Bu mağazada henüz tablet verisi bulunmuyor.</p>
                  </div>
                )}
                <div className="store-metrics">
                  <div className="store-metric">
                    <div className="metric-label">Log Sayısı</div>
                    <div className={`metric-value ${(store.totalLogs || 0) > 50 ? 'success' : (store.totalLogs || 0) > 20 ? 'warning' : 'error'}`}>
                      {store.totalLogs || 0}
                    </div>
                  </div>
                  <div className="store-metric">
                    <div className="metric-label">Hata</div>
                    <div className={`metric-value ${store.errorCount === 0 ? 'success' : store.errorCount < 5 ? 'warning' : 'error'}`}>
                      {store.errorCount || 0}
                    </div>
                  </div>
                  <div className="store-metric">
                    <div className="metric-label">Son İşlem</div>
                    <div className="metric-value time">
                      {store.lastActivity ? 
                        new Date(store.lastActivity).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 
                        '--:--'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {overviewData.storeStatus.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz tablet verisi bulunmuyor. İlk log'ları bekleniyor...</p>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="overview-section">
          <h2 className="section-title">Son Uyarılar</h2>
          <div className="alerts-list">
            {overviewData.alerts.map((alert, index) => (
              <div key={alert.id} className={`alert-item ${alert.isRead ? '' : 'unread'} ${alert.type}`}>
                <div className="alert-header">
                  {getAlertIcon(alert.type)}
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkAlertAsRead(alert.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.borderColor = '#9ca3af';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#e5e7eb';
                        e.target.style.borderColor = '#d1d5db';
                      }}
                    >
                      ✓ Okundu
                    </button>
                  )}
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
          {overviewData.alerts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p className="text-gray-500">✅ Tüm tablet'ler sorunsuz çalışıyor.</p>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="overview-section">
          <h2 className="section-title">Son Aktiviteler</h2>
          <div className="alerts-list">
            {overviewData.activities.map((activity, index) => (
              <div key={activity.id || index} className="alert-item">
                <div className="alert-header">
                  <CheckCircle className="alert-icon success" size={16} />
                  <div className="alert-title">{activity.title || activity.description}</div>
                  <div className="alert-time">
                    {new Date(activity.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {activity.details && (
                  <div className="alert-message">{activity.details}</div>
                )}
              </div>
            ))}
          </div>
          {overviewData.activities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz tablet aktivitesi bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview; 