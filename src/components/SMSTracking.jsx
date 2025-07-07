import { debugLog, debugError } from "../utils/debug.js";
import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, TrendingUp, RefreshCw, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { smsAPI } from '../services/smsAPI';
import './SMSTracking.css';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp size={16} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
};

const ApprovalTypeCard = ({ approvalType }) => {
  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{approvalType.type}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approvalType.status)}`}>
          {approvalType.status === 'active' ? 'Aktif' : 'Pasif'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Toplam Gönderim</span>
          <span className="font-semibold">{approvalType.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Başarılı</span>
          <span className="font-semibold text-green-600">{approvalType.success}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Başarı Oranı</span>
          <span className="font-semibold">{approvalType.rate}%</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${approvalType.rate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const SMSTracking = () => {
  const [smsAnalytics, setSmsAnalytics] = useState({
    stats: {
      totalSent: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    },
    hourlyDistribution: [],
    approvalTypes: [],
    errorAnalysis: [], // ✅ SMS hata analizi eklendi
    systemStatus: {
      status: 'active',
      uptime: '99.9%',
      lastCheck: new Date().toISOString()
    }
  });
  const [scope, setScope] = useState('daily'); // daily, monthly, yearly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSMSData();
  }, [scope]);

  const loadSMSData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Backend'den detaylı SMS verilerini çek (hata analizi dahil)
      const [detailedData, hourlyData, approvalData, errorAnalysis, statusData] = await Promise.all([
        smsAPI.getDetailedSMSData({ scope }).catch(() => ({ 
          stats: { totalSent: 0, totalSuccess: 0, totalFailed: 0 },
          logs: [] 
        })),
        smsAPI.getHourlyDistribution({ scope }).catch(() => []),
        smsAPI.getApprovalTypes({ scope }).catch(() => []),
        smsAPI.getSMSErrorAnalysis({ scope }).catch(() => []), // ✅ SMS hata analizi eklendi
        smsAPI.getSystemStatus().catch(() => ({ status: 'inactive', uptime: 'Veri yok', lastCheck: new Date().toISOString() }))
      ]);

      // ✅ Backend formatını frontend formatına dönüştür
      debugLog('🔍 SMS Tracking - Raw detailedData:', detailedData);
      debugLog('🔍 SMS Tracking - detailedData.stats:', detailedData.stats);
      
      const normalizedStats = {
        totalSent: detailedData.stats.totalSent || 0,
        approved: detailedData.stats.totalSuccess || 0,
        pending: Math.max(0, (detailedData.stats.totalSent || 0) - (detailedData.stats.totalSuccess || 0) - (detailedData.stats.totalFailed || 0)),
        rejected: detailedData.stats.totalFailed || 0
      };
      
      debugLog('🔍 SMS Tracking - Normalized stats:', normalizedStats);

      setSmsAnalytics({
        stats: normalizedStats,
        hourlyDistribution: hourlyData,
        approvalTypes: approvalData,
        errorAnalysis: errorAnalysis, // ✅ SMS hata analizi eklendi
        systemStatus: statusData
      });
    } catch (err) {
      debugError('Error loading SMS data:', err);
      setError('SMS verileri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadSMSData();
    } catch (err) {
      debugError('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await smsAPI.exportSMSData();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sms_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      debugError('Export error:', err);
      alert('Dışa aktarma sırasında hata oluştu.');
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin" size={48} />
            <p className="text-gray-600">SMS verileri yükleniyor...</p>
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
            <h1 className="page-title">SMS Takip Sistemi</h1>
            <p className="page-subtitle">SMS gönderim ve onay durumu analizi</p>
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

      {/* Metrics Cards */}
      <div className="content-section">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{smsAnalytics.stats.totalSent || 0}</p>
                <p className="text-sm text-gray-600">Toplam Gönderim</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{smsAnalytics.stats.approved || 0}</p>
                <p className="text-sm text-gray-600">Onaylanan</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{smsAnalytics.stats.pending || 0}</p>
                <p className="text-sm text-gray-600">Bekleyen</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{smsAnalytics.stats.rejected || 0}</p>
                <p className="text-sm text-gray-600">Reddedilen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="content-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution Chart */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saatlik Dağılım</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={smsAnalytics.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Approval Types Pie Chart */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Onay Tipleri</h3>
            <ResponsiveContainer width="100%" height={300}>
              {(() => {
                // Sadece value > 0 olan elemanları filtrele
                const filteredApprovalTypes = smsAnalytics.approvalTypes.filter(item => item.value > 0);
                
                if (filteredApprovalTypes.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Henüz onay verisi bulunmuyor</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <PieChart>
                    <Pie
                      data={filteredApprovalTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredApprovalTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sistem Durumu</h3>
            {refreshing && (
              <RefreshCw size={16} className="animate-spin text-blue-600" />
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                smsAnalytics.systemStatus.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <p className="font-semibold">{
                  smsAnalytics.systemStatus.status === 'active' ? 'Aktif' : 'Pasif'
                }</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="font-semibold">{smsAnalytics.systemStatus.uptime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Son Kontrol</p>
                <p className="font-semibold">
                  {new Date(smsAnalytics.systemStatus.lastCheck).toLocaleTimeString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Error Analysis - Detaylı SMS Sorunları */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylı SMS Sorunları</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Kod</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Sorun Türü</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Sayı</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Mağazalar</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Son Oluşma</th>
                </tr>
              </thead>
              <tbody>
                {smsAnalytics.errorAnalysis.map((issue, index) => (
                  <tr key={issue.issueCode} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {issue.issueCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium">{issue.issueTitle}</p>
                        <p className="text-xs text-gray-500">{issue.issueCategory}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">{issue.count}</span>
                        <span className="text-xs text-gray-500">kez</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        {issue.stores.length > 0 ? (
                          <div>
                            <p className="text-sm text-gray-900">{issue.stores[0]}</p>
                            {issue.stores.length > 1 && (
                              <p className="text-xs text-gray-500">+{issue.stores.length - 1} diğer</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Mağaza belirtilmemiş</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {issue.details.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <p>{new Date(issue.details[0].timestamp).toLocaleDateString('tr-TR')}</p>
                          <p className="font-mono">{new Date(issue.details[0].timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {smsAnalytics.errorAnalysis.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                <p className="text-green-600 text-sm font-medium">🎉 SMS sisteminde sorun bulunmuyor</p>
                <p className="text-gray-400 text-xs mt-1">Tüm SMS işlemleri sorunsuz çalışıyor</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSTracking; 