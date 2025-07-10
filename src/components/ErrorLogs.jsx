import { debugLog, debugError } from "../utils/debug.js";
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, XCircle, Filter, Search, Calendar, Download, RefreshCw } from 'lucide-react';
import { loggingAPI } from '../services/loggingAPI';
import { dashboardAPI } from '../services/dashboardAPI';
import './ErrorLogs.css';

const ErrorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logStats, setLogStats] = useState({
    total: 0,
    error: 0,
    warning: 0,
    info: 0
  });
  const [scope, setScope] = useState('daily'); // daily, monthly, yearly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hideUnknown, setHideUnknown] = useState(true); // UNKNOWN kayıtları varsayılan olarak gizle
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Filter out UNKNOWN entries if hideUnknown is true and sort by timestamp (newest first)
  const filterLogs = (logsList) => {
    let filteredLogs = logsList;
    
    if (hideUnknown) {
      filteredLogs = logsList.filter(log => 
        log.storeCode !== 'UNKNOWN' && 
        log.storeName !== 'UNKNOWN' &&
        log.storeCode && 
        log.storeName
      );
    }
    
    // Sort by timestamp (newest first)
    return filteredLogs.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt || 0);
      const dateB = new Date(b.timestamp || b.createdAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Initial data load
  useEffect(() => {
    loadData();
    
    // 🔄 Real-time updates - Her 45 saniyede bir log'ları güncelle
    const interval = setInterval(() => {
      loadDataSilently(); // Background refresh
    }, 45000); // 45 saniye (loglar için biraz daha uzun)
    
    return () => clearInterval(interval);
  }, [scope]);

  // Hash navigation - #errors hash'ini dinle
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#errors') {
        // Sayfa yüklendiğinde veya hash değiştiğinde errors bölümüne scroll yap
        const errorsSection = document.getElementById('errors-section');
        if (errorsSection) {
          errorsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    // Sayfa yüklendiğinde hash'i kontrol et
    handleHashChange();

    // Hash değişikliklerini dinle
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadLogs();
    }
  }, [filterLevel, filterCategory, searchTerm, hideUnknown, scope]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all required data in parallel
      const [logsData, statsData, categoriesData, overviewData] = await Promise.all([
        loggingAPI.getLogs({
          level: filterLevel !== 'all' ? filterLevel : undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          search: searchTerm || undefined,
          scope: scope
        }),
        loggingAPI.getLogStats({ scope }),
        loggingAPI.getLogCategories(),
        dashboardAPI.getOverviewData(scope === 'daily' ? 'gunluk' : scope === 'monthly' ? 'aylik' : 'yillik')
      ]);

      debugLog('🔍 ErrorLogs - Raw logsData:', logsData);
      debugLog('🔍 ErrorLogs - Raw statsData:', statsData);
      debugLog('🔍 ErrorLogs - Raw categoriesData:', categoriesData);
      debugLog('🔍 ErrorLogs - Raw overviewData:', overviewData);
      debugLog('🔍 ErrorLogs - overviewData.recentErrors:', overviewData?.recentErrors);
      debugLog('🔍 ErrorLogs - logsData.logs:', logsData?.logs);
      debugLog('🔍 ErrorLogs - logsData type:', typeof logsData);

      // Hata logları verisini sadece /logs endpoint'inden al
      const rawLogs = logsData.logs || [];
      debugLog('🔍 ErrorLogs - rawLogs:', rawLogs);
      debugLog('🔍 ErrorLogs - rawLogs length:', rawLogs.length);
      
      setLogs(filterLogs(rawLogs));
      setLogStats(statsData || logStats);
      setCategories(categoriesData || []);
      setLastUpdateTime(new Date()); // ⏰ Son güncelleme zamanını kaydet
    } catch (err) {
      debugError('Error loading data:', err);
      setError('Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // 🔇 Sessiz veri yükleme (loading indicator'sız) - Real-time updates için
  const loadDataSilently = async () => {
    try {
      setIsAutoRefreshing(true);
      
      // Load all required data in parallel (with current filters)
      const [logsData, statsData] = await Promise.all([
        loggingAPI.getLogs({
          level: filterLevel !== 'all' ? filterLevel : undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          search: searchTerm || undefined,
          scope: scope
        }),
        loggingAPI.getLogStats({ scope })
      ]);

      const rawLogs = logsData.logs || logsData || [];
      setLogs(filterLogs(rawLogs));
      setLogStats(statsData || logStats);
      setLastUpdateTime(new Date());
      setError(null); // Clear any previous errors
      
      debugLog('🔄 Error logs auto-refreshed:', new Date().toLocaleTimeString('tr-TR'));
      
    } catch (err) {
      debugError('Auto-refresh error (silent):', err);
      // Don't show error to user for background refresh
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const loadLogs = async () => {
    try {
      setRefreshing(true);
      const filters = {
        level: filterLevel !== 'all' ? filterLevel : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        search: searchTerm || undefined,
        scope: scope
      };
      
      const logsData = await loggingAPI.getLogs(filters);
      const rawLogs = logsData.logs || logsData || [];
      setLogs(filterLogs(rawLogs));
    } catch (err) {
      debugError('Error loading logs:', err);
      setError('Loglar yüklenirken hata oluştu.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleExport = async () => {
    try {
      const filters = {
        level: filterLevel !== 'all' ? filterLevel : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        search: searchTerm || undefined,
        scope: scope
      };
      
      const blob = await loggingAPI.exportLogs(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `error_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      debugError('Export error:', err);
      alert('Dışa aktarma sırasında hata oluştu.');
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'ERROR': return <XCircle className="text-red-600" size={20} />;
      case 'WARNING': return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'INFO': return <Info className="text-blue-600" size={20} />;
      case 'SUCCESS': return <Info className="text-green-600" size={20} />;
      default: return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getLogLevelStyle = (level) => {
    switch (level) {
      case 'ERROR': return 'bg-red-50 text-red-700 border-red-300';
      case 'WARNING': return 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'INFO': return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'SUCCESS': return 'bg-green-50 text-green-700 border-green-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  const getCategoryStyle = (category) => {
    switch (category) {
      case 'CUSTOMER_CREATE': return 'bg-green-100 text-green-800';
      case 'SMS_APPROVAL': return 'bg-purple-100 text-purple-800';
      case 'SMS_NOTIFICATION': return 'bg-blue-100 text-blue-800';
      case 'SMS_VERIFICATION_DATA': return 'bg-indigo-100 text-indigo-800';
      case 'VALIDATION': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin" size={48} />
            <p className="text-gray-600">Veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="mx-auto mb-4 text-red-500" size={48} />
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
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Hata Log Sistemi</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p className="page-subtitle">Sistem hataları ve uyarıları</p>
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
          <div className="flex gap-3">
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
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="appearance-none rounded-lg px-3 py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  style={{
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    paddingLeft: '2.5rem',
                    paddingRight: '2rem'
                  }}
                                >
                  <option value="daily">Günlük</option>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
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
            <button
              onClick={handleExport}
              style={{
                fontSize: '0.875rem',
                opacity: 0.9,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#374151',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(16, 185, 129, 0.15)';
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.2)';
              }}
            >
              <Download size={16} />
              <span>Dışa Aktar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="content-section">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertCircle className="text-gray-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{logStats.total}</p>
                <p className="text-sm text-gray-600">Toplam Log</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{logStats.error}</p>
                <p className="text-sm text-gray-600">Hata</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{logStats.warning}</p>
                <p className="text-sm text-gray-600">Uyarı</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{logStats.info}</p>
                <p className="text-sm text-gray-600">Bilgi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtreler:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Seviye:</label>
              <select 
                value={filterLevel} 
                onChange={(e) => setFilterLevel(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <option value="all">Tümü</option>
                <option value="ERROR">Hata</option>
                <option value="WARNING">Uyarı</option>
                <option value="INFO">Bilgi</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Kategori:</label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <option value="all">Tümü</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center gap-2">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                placeholder="Mesaj, mağaza veya kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 w-64"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setHideUnknown(!hideUnknown)}
                className="group relative overflow-hidden"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '24px',
                  width: '48px',
                  borderRadius: '12px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  background: hideUnknown 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  boxShadow: hideUnknown
                    ? '0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 4px 15px rgba(245, 87, 108, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Background glow effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: hideUnknown
                      ? 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                      : 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    borderRadius: '12px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                
                {/* Slider */}
                <span 
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: hideUnknown ? '26px' : '2px',
                    width: '20px',
                    height: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '50%',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transform: hideUnknown ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
                
                {/* Icon indicators */}
                <div
                  style={{
                    position: 'absolute',
                    left: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                    opacity: hideUnknown ? '0' : '1',
                    transition: 'all 0.3s ease'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                    opacity: hideUnknown ? '1' : '0',
                    transition: 'all 0.3s ease'
                  }}
                />
              </button>
              
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: hideUnknown 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    boxShadow: hideUnknown
                      ? '0 2px 8px rgba(102, 126, 234, 0.4)'
                      : '0 2px 8px rgba(245, 87, 108, 0.3)'
                  }}
                ></span>
                <span className="transition-all duration-300" style={{ color: hideUnknown ? '#667eea' : '#f5576c' }}>
                  UNKNOWN kayıtları {hideUnknown ? 'gizle' : 'göster'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div id="errors-section" className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Log Kayıtları ({logs.length} kayıt)
            </h2>
            {refreshing && (
              <RefreshCw size={16} className="animate-spin text-blue-600" />
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zaman
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seviye
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mağaza
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesaj
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className={`hover:bg-gray-50 log-row ${log.level.toLowerCase()} ${(log.storeCode === 'UNKNOWN' || log.storeName === 'UNKNOWN') ? 'bg-gray-100 opacity-75' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getLogIcon(log.level)}
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getLogLevelStyle(log.level)}`}>
                          {log.level}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryStyle(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className={`font-medium ${(log.storeCode === 'UNKNOWN' || log.storeName === 'UNKNOWN') ? 'text-gray-500 italic' : ''}`}>
                          {log.storeName === 'UNKNOWN' ? '🔧 Sistem İnit.' : log.storeName}
                        </p>
                        <p className={`text-gray-500 font-mono text-xs ${log.storeCode === 'UNKNOWN' ? 'italic' : ''}`}>
                          {log.storeCode === 'UNKNOWN' ? 'Mağaza seçilmedi' : log.storeCode}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <p className="max-w-md">{log.message}</p>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">Detayları göster</summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm || filterLevel !== 'all' || filterCategory !== 'all' 
                    ? 'Seçilen kriterlere göre log bulunamadı.' 
                    : 'Henüz log kaydı bulunmuyor.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogs; 