import { debugLog, debugError } from "../utils/debug.js";
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Calendar, XCircle, CheckCircle, Store } from 'lucide-react';
import './CustomerAnalytics.css';

const CustomerAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    storeStats: [],
    rejectionReasons: [],
    dailyStats: [],
    loading: true,
    error: null
  });
  const [scope, setScope] = useState('daily'); // daily, monthly, yearly
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    loadCustomerAnalytics();
    
    // 🔄 Real-time updates - Her 90 saniyede bir customer analytics güncelle
    const interval = setInterval(() => {
      loadCustomerAnalyticsSilently(); // Background refresh
    }, 90000); // 90 saniye (analytics için daha uzun)
    
    return () => clearInterval(interval);
  }, [scope]);

  const loadCustomerAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true, error: null }));
      
      // Load customer analytics data only
      const { loggingAPI } = await import('../services/loggingAPI');
      
      const [rejectionReasons, customerAnalytics, logsData] = await Promise.all([
        loggingAPI.getRejectionReasons({ scope }).catch(() => []),
        loggingAPI.getCustomerAnalytics({ scope }).catch(() => ({ storeStats: [] })),
        loggingAPI.getLogs({ category: 'CUSTOMER_CREATE', scope }).catch(() => ({ logs: [] }))
      ]);

      const logs = logsData.logs || [];
      
      // Günlük istatistikleri oluştur (local processing)
      const dailyStats = generateDailyStats(logs);

      // Update analytics state only
      setAnalytics({
        storeStats: customerAnalytics.storeStats || [],
        rejectionReasons: rejectionReasons || [],
        dailyStats: dailyStats,
        loading: false,
        error: null
      });
      
      setLastUpdateTime(new Date()); // ⏰ Son güncelleme zamanını kaydet

      debugLog('📊 Customer analytics loaded:', {
        stores: customerAnalytics.storeStats?.length || 0,
        rejections: rejectionReasons?.length || 0,
        logs: logs.length
      });

    } catch (err) {
      debugError('Error loading customer analytics:', err);
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: 'Müşteri analitik verileri yüklenirken hata oluştu.'
      }));
    }
  };

  // 📅 Günlük istatistikleri oluştur (local processing)
  const generateDailyStats = (logs) => {
    const dailyMap = new Map();
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toDateString();
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date: new Date(date).toLocaleDateString('tr-TR'),
          customers: 0,
          success: 0,
          errors: 0
        });
      }
      
      const daily = dailyMap.get(date);
      daily.customers++;
      
      if (log.level === 'ERROR') {
        daily.errors++;
      } else if (log.level === 'SUCCESS') {
        daily.success++;
      }
    });
    
    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // 🔇 Sessiz veri yükleme (loading indicator'sız) - Real-time updates için
  const loadCustomerAnalyticsSilently = async () => {
    try {
      setIsAutoRefreshing(true);
      
      // Load customer analytics data only
      const { loggingAPI } = await import('../services/loggingAPI');
      
      const [rejectionReasons, customerAnalytics, logsData] = await Promise.all([
        loggingAPI.getRejectionReasons({ scope }).catch(() => []),
        loggingAPI.getCustomerAnalytics({ scope }).catch(() => ({ storeStats: [] })),
        loggingAPI.getLogs({ category: 'CUSTOMER_CREATE', scope }).catch(() => ({ logs: [] }))
      ]);

      const logs = logsData.logs || [];
      
      // Günlük istatistikleri oluştur (local processing)
      const dailyStats = generateDailyStats(logs);

      // Update analytics state only
      setAnalytics(prev => ({
        ...prev,
        storeStats: customerAnalytics.storeStats || [],
        rejectionReasons: rejectionReasons || [],
        dailyStats: dailyStats,
        error: null
      }));
      
      setLastUpdateTime(new Date());
      
      debugLog('🔄 Customer analytics auto-refreshed:', new Date().toLocaleTimeString('tr-TR'));
      
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
      await loadCustomerAnalytics();
    } catch (err) {
      debugError('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  if (analytics.loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin" size={48} />
            <p className="text-gray-600">Müşteri analitik verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="page-container">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Hata</h2>
          <p className="text-red-600 mb-4">{analytics.error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const totalAttempts = analytics.storeStats.reduce((sum, store) => sum + store.totalAttempts, 0);
  const totalSuccessful = analytics.storeStats.reduce((sum, store) => sum + store.successfulRegistrations, 0);
  const totalFailed = analytics.storeStats.reduce((sum, store) => sum + store.failedRegistrations, 0);
  const globalSuccessRate = totalAttempts > 0 ? Math.round((totalSuccessful / totalAttempts) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Müşteri Analitik</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p className="page-subtitle">Müşteri kayıt başarı oranları ve mağaza bazlı analitik veriler</p>
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
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Global Statistics - Better UI */}
      <div className="content-section">
        <div className="summary-container">
          <div className="summary-header">
            <h2 className="summary-title">Genel İstatistikler</h2>
          </div>
          <div className="grid grid-cols-4 gap-6 general-stats">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Users className="text-blue-600" size={24} />
                <h3 className="font-semibold text-gray-900">Toplam Deneme</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalAttempts}</p>
              <p className="text-sm text-gray-600 mt-1">Müşteri kayıt denemesi</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <CheckCircle className="text-green-600" size={24} />
                <h3 className="font-semibold text-gray-900">Başarılı</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{totalSuccessful}</p>
              <p className="text-sm text-gray-600 mt-1">Başarıyla açılan</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <XCircle className="text-red-600" size={24} />
                <h3 className="font-semibold text-gray-900">Başarısız</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{totalFailed}</p>
              <p className="text-sm text-gray-600 mt-1">Red edilen</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <TrendingUp className="text-purple-600" size={24} />
                <h3 className="font-semibold text-gray-900">Başarı Oranı</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {totalAttempts > 0 ? `${globalSuccessRate}%` : 'Veri yok'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Genel başarı oranı</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Success Rates - Better UI */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Mağaza Bazlı Başarı Oranları</h2>
            <p className="text-sm text-gray-500">Müşteri kayıt performans analizi</p>
          </div>
          
          <div className="grid gap-6">
            {analytics.storeStats.length > 0 ? (
              analytics.storeStats.map((store, index) => (
                <div key={store.storeCode} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Store className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{store.storeName}</h3>
                        <p className="text-sm text-gray-500 font-mono">{store.storeCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-purple-600">{store.successRate}%</p>
                      <p className="text-sm text-gray-500">başarı oranı</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div className="text-center bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Users className="text-blue-600" size={16} />
                        <span className="text-sm font-medium text-blue-800">Toplam Deneme</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{store.totalAttempts}</p>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <CheckCircle className="text-green-600" size={16} />
                        <span className="text-sm font-medium text-green-800">Başarılı</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{store.successfulRegistrations}</p>
                    </div>
                    <div className="text-center bg-red-50 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <XCircle className="text-red-600" size={16} />
                        <span className="text-sm font-medium text-red-800">Başarısız</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{store.failedRegistrations}</p>
                    </div>
                  </div>
                  
                  {/* Simple Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Başarı Performansı</span>
                      <span className="text-sm text-gray-500">
                        {store.successfulRegistrations}/{store.totalAttempts} başarılı
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(store.successRate, 5)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Performance Rating */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Performans Durumu:</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      store.successRate >= 80 ? 'bg-green-100 text-green-800' :
                      store.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {store.successRate >= 80 ? '🎯 Mükemmel' :
                       store.successRate >= 60 ? '⚡ İyi' : '⚠️ Geliştirilmeli'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Store className="text-gray-400" size={40} />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">Henüz mağaza verisi bulunmuyor</p>
                <p className="text-gray-400 text-sm">Müşteri kayıt denemelerinin toplanması bekleniyor...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section - Better UI */}
      <div className="content-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Rate Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mağaza Başarı Oranları</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.storeStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="storeCode" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Başarı Oranı']}
                  labelFormatter={(label) => `Mağaza: ${label}`}
                />
                <Bar dataKey="successRate" fill="#10b981" name="Başarı Oranı" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rejection Reasons Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Red Sebepleri Dağılımı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.rejectionReasons.slice(0, 6).map(reason => ({
                    name: reason.reasonMapping,
                    value: reason.details.length,
                    rejectionCode: reason.rejectionCode,
                    reasonMapping: reason.reasonMapping
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reasonMapping, percent }) => 
                    percent > 10 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.rejectionReasons.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, props.payload.reasonMapping]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rejection Reasons Table - Better UI */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylı Red Sebepleri</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Kod</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Sebep</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Müşteri</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Mağaza</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Plasiyer</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Tarih/Saat</th>
                </tr>
              </thead>
              <tbody>
                {analytics.rejectionReasons.flatMap(reason => 
                  reason.details.map((detail, detailIndex) => ({
                    ...detail,
                    reason,
                    detailIndex
                  }))
                )
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((item, globalIndex) => (
                    <tr key={`${item.reason.rejectionCode}-${globalIndex}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.reason.rejectionCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium">{item.reason.reasonMapping}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900">{item.customerName || 'Bilinmiyor'}</p>
                          {item.tcNumber && (
                            <p className="text-xs text-gray-500">TC: {item.tcNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.storeName || 'Bilinmiyor'}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.storeCode || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-900">{item.employeeName || 'Belirtilmemiş'}</p>
                          {item.employeeCode && (
                            <p className="text-xs text-gray-500 font-mono">{item.employeeCode}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-xs text-gray-500">
                          <p>{new Date(item.timestamp).toLocaleDateString('tr-TR')}</p>
                          <p className="font-mono">{new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            
            {analytics.rejectionReasons.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg font-medium">Henüz red edilen müşteri kaydı bulunmuyor</p>
                <p className="text-gray-400 text-sm mt-2">Başarısız kayıt denemeleri burada listelenecek</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics; 