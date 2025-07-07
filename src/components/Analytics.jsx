import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Cpu, HardDrive, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { analyticsAPI } from '../services/analyticsAPI';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    dailyTrend: [],
    performanceMetrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkUsage: 0
    },
    storeAnalytics: [],
    efficiencyScore: 0,
    systemMetrics: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all analytics data in parallel
      const [dailyData, performanceData, storeData, efficiencyData, systemData] = await Promise.all([
        analyticsAPI.getDailyTrend().catch(() => []),
        analyticsAPI.getPerformanceMetrics().catch(() => ({ cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkUsage: 0 })),
        analyticsAPI.getStoreAnalytics().catch(() => []),
        analyticsAPI.getEfficiencyScore().catch(() => 0),
        analyticsAPI.getSystemMetrics().catch(() => ({}))
      ]);

      setAnalyticsData({
        dailyTrend: dailyData,
        performanceMetrics: performanceData,
        storeAnalytics: storeData,
        efficiencyScore: efficiencyData,
        systemMetrics: systemData
      });
    } catch (err) {
      debugError('Error loading analytics data:', err);
      setError('Analytics verileri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAnalyticsData();
    } catch (err) {
      debugError('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await analyticsAPI.exportAnalytics();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      debugError('Export error:', err);
      alert('Dışa aktarma sırasında hata oluştu.');
    }
  };

  const getProgressColor = (value) => {
    if (value < 50) return '#10b981'; // green
    if (value < 80) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#3b82f6'];

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin" size={48} />
            <p className="text-gray-600">Analytics verileri yükleniyor...</p>
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
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Sistem Analytics</h1>
            <p className="page-subtitle">Performans metrikleri ve trend analizi</p>
          </div>
          <div className="flex gap-2">
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
              Dışa Aktar
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Sistem Performansı</h2>
            {refreshing && (
              <RefreshCw size={16} className="animate-spin text-blue-600" />
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            <div className="performance-metric">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="text-blue-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">CPU Kullanımı</p>
                  <p className="text-sm text-gray-600">{analyticsData.performanceMetrics.cpuUsage}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${analyticsData.performanceMetrics.cpuUsage}%`,
                    backgroundColor: getProgressColor(analyticsData.performanceMetrics.cpuUsage)
                  }}
                ></div>
              </div>
            </div>

            <div className="performance-metric">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Bellek Kullanımı</p>
                  <p className="text-sm text-gray-600">{analyticsData.performanceMetrics.memoryUsage}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${analyticsData.performanceMetrics.memoryUsage}%`,
                    backgroundColor: getProgressColor(analyticsData.performanceMetrics.memoryUsage)
                  }}
                ></div>
              </div>
            </div>

            <div className="performance-metric">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="text-yellow-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Disk Kullanımı</p>
                  <p className="text-sm text-gray-600">{analyticsData.performanceMetrics.diskUsage}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${analyticsData.performanceMetrics.diskUsage}%`,
                    backgroundColor: getProgressColor(analyticsData.performanceMetrics.diskUsage)
                  }}
                ></div>
              </div>
            </div>

            <div className="performance-metric">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-purple-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Ağ Kullanımı</p>
                  <p className="text-sm text-gray-600">{analyticsData.performanceMetrics.networkUsage}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${analyticsData.performanceMetrics.networkUsage}%`,
                    backgroundColor: getProgressColor(analyticsData.performanceMetrics.networkUsage)
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="content-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trend Chart */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">7 Günlük Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Store Status Distribution */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mağaza Durumu Dağılımı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.storeAnalytics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.storeAnalytics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performans Trendi</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#10b981" name="Bellek" />
              <Line type="monotone" dataKey="disk" stroke="#f59e0b" name="Disk" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Efficiency Score */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Verimliliği</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={getProgressColor(analyticsData.efficiencyScore)}
                    strokeWidth="2"
                    strokeDasharray={`${analyticsData.efficiencyScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {analyticsData.efficiencyScore > 0 ? `${analyticsData.efficiencyScore}%` : 'Veri yok'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-600">Genel sistem performansı değerlendirmesi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 