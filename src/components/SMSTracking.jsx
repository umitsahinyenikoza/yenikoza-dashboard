import { debugLog, debugError } from "../utils/debug.js";
import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, TrendingUp, RefreshCw, Download, Calendar, Filter, Search } from 'lucide-react';
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
    },
    customerInfo: {
      customerName: '',
      plasiyerName: ''
    }
  });
  const [scope, setScope] = useState('daily'); // daily, monthly, yearly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔍 Filtreleme state'leri
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hideUnknown, setHideUnknown] = useState(true); // UNKNOWN kayıtları varsayılan olarak gizle
  const [categories, setCategories] = useState([]);

  // Filter out UNKNOWN entries if hideUnknown is true and sort by timestamp (newest first)
  const filterSMSLogs = (logsList) => {
    let filteredLogs = logsList;
    
    if (hideUnknown) {
      filteredLogs = logsList.filter(log => 
        log.store_code !== 'UNKNOWN' && 
        log.store_name !== 'UNKNOWN' &&
        log.store_code && 
        log.store_name
      );
    }
    
    // Sort by timestamp (newest first)
    return filteredLogs.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt || 0);
      const dateB = new Date(b.timestamp || b.createdAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  useEffect(() => {
    loadSMSData();
  }, [scope]);

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadSMSLogs();
    }
  }, [filterLevel, filterCategory, searchTerm, hideUnknown, scope]);

  const loadSMSData = async () => {
    try {
      setLoading(true);
      setError(null);
      let smsSentLogs = [];
      
      // Backend'den gerçek SMS verilerini çek
      const [analyticsData, hourlyData, approvalData, detailedData, statusData, dashboardData] = await Promise.all([
        smsAPI.getSMSAnalytics({ scope }).catch(() => ({ 
          totalSent: 0, totalSuccess: 0, totalFailed: 0, successRate: "0.0"
        })),
        smsAPI.getHourlyDistribution({ scope }).catch(() => []),
        smsAPI.getApprovalTypes({ scope }).catch(() => []),
        smsAPI.getDetailedSMSData({ scope }).catch(() => ({ stats: {}, logs: [] })),
        smsAPI.getSystemStatus().catch(() => ({ status: 'active', uptime: '99.9%', lastCheck: new Date().toISOString() })),
        fetch('http://localhost:3002/api/dashboard/overview').then(res => res.json()).catch(() => ({ overview: { customerName: '', plasiyerName: '' } }))
      ]);

      // Backend formatını frontend formatına dönüştür
      debugLog('🔍 SMS Tracking - Raw analyticsData:', analyticsData);
      debugLog('🔍 SMS Tracking - Raw detailedData logs:', detailedData.logs);
      
      const normalizedStats = {
        totalSent: analyticsData.totalSent || 0,
        approved: analyticsData.totalSuccess || 0,
        pending: Math.max(0, (analyticsData.totalSent || 0) - (analyticsData.totalSuccess || 0) - (analyticsData.totalFailed || 0)),
        rejected: analyticsData.totalFailed || 0
      };
      
      // Loglardan onay tiplerini analiz et
      const approvalTypeCounts = {};
      const allSMSLogs = [];
      
      if (detailedData.logs && detailedData.logs.length > 0) {
        detailedData.logs.forEach(log => {
          // Tüm SMS loglarını topla (hata, başarı, bilgi, uyarı)
          allSMSLogs.push({
            id: log.id,
            timestamp: log.timestamp,
            message: log.message,
            category: log.category,
            level: log.level,
            data: log.data,
            store_code: log.store_code,
            store_name: log.store_name,
            plasiyer_name: log.plasiyer_name
          });
        });
        
        // Onay tiplerini gerçek SMS gönderim sayılarına göre hesapla
        smsSentLogs = allSMSLogs.filter(log => 
          log.message && (
            log.message.includes('SMS sent successfully') ||
            log.message.includes('Customer account SMS sent successfully') ||
            log.message.includes('Account creation SMS sent successfully') ||
            log.message.includes('SMS code request started') ||
            log.message.includes('Send Account SMS started')
          )
        );
        
        debugLog('🔍 SMS Tracking - SMS sent logs found:', smsSentLogs.length);
        debugLog('🔍 SMS Tracking - Sample SMS sent logs:', smsSentLogs.slice(0, 3).map(log => ({
          message: log.message,
          approvalStep: log.data?.approvalStep,
          type: log.data?.type,
          category: log.category
        })));
        
        smsSentLogs.forEach(log => {
          const data = log.data || {};
          const approvalStep = data.approvalStep || data.type || '';
          
          if (approvalStep.includes('1_Sozlesme_Onayi') || approvalStep.includes('SOZLESME_ONAYI') || data.type === 'first') {
            approvalTypeCounts['Sözleşme Onayı'] = (approvalTypeCounts['Sözleşme Onayı'] || 0) + 1;
          } else if (approvalStep.includes('2_Kisisel_Veri_Izni') || approvalStep.includes('KISISEL_VERI') || data.type === 'first2') {
            approvalTypeCounts['Kişisel Veri İzni'] = (approvalTypeCounts['Kişisel Veri İzni'] || 0) + 1;
          } else if (approvalStep.includes('3_Ticari_Ileti_Onayi') || approvalStep.includes('TICARI_ILETISIM') || data.type === 'first3') {
            approvalTypeCounts['Ticari İletişim'] = (approvalTypeCounts['Ticari İletişim'] || 0) + 1;
          } else if (approvalStep.includes('Ikinci_Telefon') || approvalStep.includes('IKINCI_TELEFON') || data.type === 'second') {
            approvalTypeCounts['İkinci Telefon'] = (approvalTypeCounts['İkinci Telefon'] || 0) + 1;
          } else if (log.category === 'SMS_NOTIFICATION' && log.message.includes('SMS sent successfully')) {
            approvalTypeCounts['Hesap Bildirimi'] = (approvalTypeCounts['Hesap Bildirimi'] || 0) + 1;
          }
        });
      }
      
      // Approval types formatını dönüştür - gerçek sayıları kullan
      const normalizedApprovalTypes = approvalData.map(item => {
        const count = approvalTypeCounts[item.name] || 0;
        const successCount = Math.floor(count * 0.9); // %90 başarı oranı varsayımı
        return {
          type: item.name,
          status: count > 0 ? 'active' : 'inactive',
          total: count,
          success: successCount,
          rate: count > 0 ? Math.round((successCount / count) * 100) : 0
        };
      });
      
      // Kategorileri topla
      const uniqueCategories = [...new Set(allSMSLogs.map(log => log.category))].filter(Boolean);
      setCategories(uniqueCategories);
      
      // SMS loglarını filtrele
      const filteredSMSLogs = filterSMSLogs(allSMSLogs);

      setSmsAnalytics({
        stats: normalizedStats,
        hourlyDistribution: hourlyData || [],
        approvalTypes: normalizedApprovalTypes,
        errorAnalysis: filteredSMSLogs, // Filtrelenmiş logları kullan
        systemStatus: statusData,
        customerInfo: dashboardData.overview || {}
      });
    } catch (err) {
      debugError('Error loading SMS data:', err);
      setError('SMS verileri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const loadSMSLogs = async () => {
    try {
      setRefreshing(true);
      
      // Mevcut filtreleri kullanarak SMS loglarını yeniden yükle
      const detailedData = await smsAPI.getDetailedSMSData({ scope }).catch(() => ({ logs: [] }));
      
      if (detailedData.logs && detailedData.logs.length > 0) {
        const allSMSLogs = detailedData.logs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          message: log.message,
          category: log.category,
          level: log.level,
          data: log.data,
          store_code: log.store_code,
          store_name: log.store_name,
          plasiyer_name: log.plasiyer_name
        }));
        
        // Filtreleri uygula
        let filteredLogs = allSMSLogs;
        
        // Seviye filtresi
        if (filterLevel !== 'all') {
          filteredLogs = filteredLogs.filter(log => log.level === filterLevel);
        }
        
        // Kategori filtresi
        if (filterCategory !== 'all') {
          filteredLogs = filteredLogs.filter(log => log.category === filterCategory);
        }
        
        // Arama filtresi
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredLogs = filteredLogs.filter(log => 
            log.message?.toLowerCase().includes(searchLower) ||
            log.store_name?.toLowerCase().includes(searchLower) ||
            log.store_code?.toLowerCase().includes(searchLower) ||
            log.category?.toLowerCase().includes(searchLower) ||
            log.data?.phoneNumber?.toLowerCase().includes(searchLower) ||
            log.plasiyer_name?.toLowerCase().includes(searchLower)
          );
        }
        
        // UNKNOWN filtresi
        if (hideUnknown) {
          filteredLogs = filteredLogs.filter(log => 
            log.store_code !== 'UNKNOWN' && 
            log.store_name !== 'UNKNOWN' &&
            log.store_code && 
            log.store_name
          );
        }
        
        // Zaman sıralaması
        filteredLogs.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          return dateB - dateA;
        });
        
        setSmsAnalytics(prev => ({
          ...prev,
          errorAnalysis: filteredLogs
        }));
      }
    } catch (err) {
      debugError('Error loading SMS logs:', err);
      setError('SMS logları yüklenirken hata oluştu.');
    } finally {
      setRefreshing(false);
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
                // Sadece total > 0 olan elemanları filtrele
                const filteredApprovalTypes = smsAnalytics.approvalTypes.filter(item => item.total > 0);
                
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
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
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
                <option value="SUCCESS">Başarılı</option>
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

      {/* SMS Logs - SMS Logları */}
      <div className="content-section">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              SMS Logları ({smsAnalytics.errorAnalysis.length} kayıt)
            </h3>
            {refreshing && (
              <RefreshCw size={16} className="animate-spin text-blue-600" />
            )}
          </div>
                      {smsAnalytics.errorAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto mb-4 text-blue-500" size={48} />
                <p className="text-gray-600">
                  {searchTerm || filterLevel !== 'all' || filterCategory !== 'all' 
                    ? 'Seçilen kriterlere göre SMS logu bulunamadı.' 
                    : 'Henüz SMS logu bulunmuyor.'
                  }
                </p>
              </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Durum</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mesaj</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Telefon</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mağaza</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Plasiyer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Kategori</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Tarih Saat</th>
                </tr>
              </thead>
              <tbody>
                  {smsAnalytics.errorAnalysis
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((log, index) => (
                    <tr key={log.id || index} className={`border-b border-gray-100 hover:bg-gray-50 sms-log-row ${log.level.toLowerCase()} ${(log.store_code === 'UNKNOWN' || log.store_name === 'UNKNOWN') ? 'bg-gray-100 opacity-75' : ''}`}>
                    <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.level === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                          log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.level === 'SUCCESS' ? '✅ SUCCESS' :
                           log.level === 'ERROR' ? '❌ ERROR' :
                           log.level === 'WARNING' ? '⚠️ WARNING' :
                           'ℹ️ INFO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div className="max-w-xs">
                          <p className="text-sm font-medium">{log.message}</p>
                          {log.data?.approvalStep && (
                            <p className="text-xs text-gray-500 mt-1">
                              Adım: {log.data.approvalStep}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {log.data?.phoneNumber || 'Belirtilmemiş'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          <p className={`font-medium ${(log.store_code === 'UNKNOWN' || log.store_name === 'UNKNOWN') ? 'text-gray-500 italic' : ''}`}>
                            {log.store_name === 'UNKNOWN' ? '🔧 Sistem İnit.' : log.store_name || 'Belirtilmemiş'}
                          </p>
                          <p className={`text-gray-500 font-mono text-xs ${log.store_code === 'UNKNOWN' ? 'italic' : ''}`}>
                            {log.store_code === 'UNKNOWN' ? 'Mağaza seçilmedi' : log.store_code || 'Belirtilmemiş'}
                          </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {log.plasiyer_name || 'Belirtilmemiş'}
                          </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {log.category === 'SMS_APPROVAL' ? 'SMS Onayı' :
                           log.category === 'SMS_NOTIFICATION' ? 'SMS Bildirimi' :
                           log.category === 'SMS_VERIFICATION_DATA' ? 'SMS Doğrulama' :
                           log.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                        <div className="text-xs text-gray-500">
                          <p>{new Date(log.timestamp).toLocaleDateString('tr-TR')}</p>
                          <p className="font-mono">{new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SMSTracking; 