import React, { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, Calendar, Filter, Search } from 'lucide-react';
import reportsAPI from '../services/reportsAPI';
import './Reports.css';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [reportTypes, setReportTypes] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState(null);

  const periodOptions = [
    { value: 'daily', label: 'Günlük', icon: '📅' },
    { value: 'weekly', label: 'Haftalık', icon: '📆' },
    { value: 'monthly', label: 'Aylık', icon: '📊' },
    { value: 'yearly', label: 'Yıllık', icon: '📈' },
    { value: 'custom', label: 'Özel Aralık', icon: '🎯' }
  ];

  // Component yüklendiğinde rapor türlerini ve son raporları al
  useEffect(() => {
    loadReportTypes();
    loadRecentReports();
  }, []);

  const loadReportTypes = async () => {
    try {
      const types = await reportsAPI.getReportTypes();
      setReportTypes(types);
    } catch (error) {
      debugError('Rapor türleri yüklenemedi:', error);
      setError('Rapor türleri yüklenemedi');
    }
  };

  const loadRecentReports = async () => {
    try {
      const reports = await reportsAPI.getRecentReports();
      setRecentReports(reports);
    } catch (error) {
      debugError('Son raporlar yüklenemedi:', error);
      setError('Son raporlar yüklenemedi');
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await reportsAPI.generateReport(
        selectedReport,
        selectedPeriod,
        selectedPeriod === 'custom' ? dateRange : null
      );
      setGeneratedReport(reportData);
    } catch (error) {
      debugError('Rapor oluşturma hatası:', error);
      setError('Rapor oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!generatedReport) {
      setError('Önce rapor oluşturmalısınız');
      return;
    }

    try {
      if (format === 'PDF') {
        await reportsAPI.downloadReportPDF(generatedReport.id || 'temp');
      } else if (format === 'Excel') {
        await reportsAPI.downloadReportExcel(generatedReport.id || 'temp');
      }
    } catch (error) {
      debugError(`${format} export hatası:`, error);
      setError(`${format} export başarısız`);
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      setLoading(true);
      const reportData = await reportsAPI.getReportById(reportId);
      setGeneratedReport(reportData);
      // Rapor önizleme alanına scroll yap
      document.querySelector('.report-preview').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      debugError('Rapor görüntüleme hatası:', error);
      setError('Rapor görüntülenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId, format = 'PDF') => {
    try {
      setLoading(true);
      if (format === 'PDF') {
        await reportsAPI.downloadReportPDF(reportId);
      } else if (format === 'Excel') {
        await reportsAPI.downloadReportExcel(reportId);
      }
    } catch (error) {
      debugError('Rapor indirme hatası:', error);
      setError('Rapor indirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="reports-title">
          <h1>📄 Raporlar</h1>
          <p>Detaylı analiz ve raporlar oluşturun</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="reports-content">
        {/* Report Configuration */}
        <div className="report-config-section">
          <div className="config-card">
            <h3>📋 Rapor Türü</h3>
            <div className="report-types-grid">
              {reportTypes.map(report => (
                <div
                  key={report.id}
                  className={`report-type-card ${selectedReport === report.id ? 'selected' : ''}`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="report-type-icon">{report.icon}</div>
                  <div className="report-type-info">
                    <h4>{report.name}</h4>
                    <p>{report.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="config-card">
            <h3>⏰ Zaman Aralığı</h3>
            <div className="period-selector">
              {periodOptions.map(period => (
                <button
                  key={period.value}
                  className={`period-option ${selectedPeriod === period.value ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  <span className="period-icon">{period.icon}</span>
                  <span>{period.label}</span>
                </button>
              ))}
            </div>

            {selectedPeriod === 'custom' && (
              <div className="custom-date-range">
                <div className="date-input-group">
                  <label>Başlangıç:</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="date-input-group">
                  <label>Bitiş:</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="reports-actions">
          <button
            className="generate-report-btn"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Rapor Oluşturuluyor...
              </>
            ) : (
              <>
                <BarChart3 size={20} />
                Rapor Oluştur
              </>
            )}
          </button>

          <div className="export-buttons">
            <button
              className="export-btn pdf"
              onClick={() => handleExport('PDF')}
              disabled={loading || !generatedReport}
            >
              <FileText size={18} />
              PDF Export
            </button>
            <button
              className="export-btn excel"
              onClick={() => handleExport('Excel')}
              disabled={loading || !generatedReport}
            >
              <Download size={18} />
              Excel Export
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="report-preview">
          <div className="preview-header">
            <h3>📊 Rapor Önizleme</h3>
            <div className="preview-actions">
              <button className="refresh-btn" onClick={loadRecentReports}>
                <Search size={16} />
                Yenile
              </button>
            </div>
          </div>
          
          <div className="preview-content">
            {generatedReport ? (
              <div className="report-data">
                <div className="report-meta">
                  <h4>{reportTypes.find(r => r.id === generatedReport.reportType)?.name || 'Rapor'}</h4>
                  <p>Oluşturulma: {formatDate(generatedReport.generatedAt)}</p>
                  <p>Dönem: {generatedReport.period}</p>
                  {generatedReport.dateRange && (
                    <p>Tarih Aralığı: {formatDate(generatedReport.dateRange.start)} - {formatDate(generatedReport.dateRange.end)}</p>
                  )}
                </div>
                <div className="report-summary">
                  <pre>{JSON.stringify(generatedReport.reportData, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="preview-placeholder">
                <div className="placeholder-icon">📊</div>
                <h4>Rapor Önizlemesi</h4>
                <p>Rapor oluşturulduktan sonra burada görüntülenecek</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="recent-reports">
          <h3>📋 Son Raporlar</h3>
          <div className="recent-reports-list">
            {recentReports.length > 0 ? (
              recentReports.map(report => (
                <div key={report.id} className="recent-report-item">
                  <div className="report-info">
                    <div className="report-icon">
                      {reportTypes.find(r => r.id === report.type)?.icon || '📄'}
                    </div>
                    <div>
                      <h4>{report.name}</h4>
                      <p>{formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}</p>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button 
                      className="view-btn" 
                      onClick={() => handleViewReport(report.id)}
                      disabled={loading}
                    >
                      {loading ? 'Yükleniyor...' : 'Görüntüle'}
                    </button>
                    <button 
                      className="download-btn" 
                      onClick={() => handleDownloadReport(report.id, 'PDF')}
                      disabled={loading}
                    >
                      {loading ? 'İndiriliyor...' : 'İndir'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-reports">
                <p>Henüz rapor oluşturulmamış</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 