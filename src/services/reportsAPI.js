import { debugLog, debugError } from '../utils/debug.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ReportsAPI {
  constructor() {
    this.baseURL = API_URL;
  }

  // Token'ı al
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Rapor türlerini al
  async getReportTypes() {
    try {
      const response = await fetch(`${this.baseURL}/reports/types`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      debugError('❌ Error fetching report types:', error);
      throw error;
    }
  }

  // Rapor oluştur
  async generateReport(reportType, period, dateRange = null) {
    try {
      const payload = {
        reportType,
        period,
        ...(dateRange && { dateRange })
      };

      const response = await fetch(`${this.baseURL}/reports/generate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      debugError('❌ Error generating report:', error);
      throw error;
    }
  }

  // Son raporları al
  async getRecentReports() {
    try {
      const response = await fetch(`${this.baseURL}/reports/recent`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      debugError('❌ Error fetching recent reports:', error);
      throw error;
    }
  }

  // Raporu ID ile al
  async getReportById(reportId) {
    try {
      const response = await fetch(`${this.baseURL}/reports/${reportId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      debugError('❌ Error fetching report by ID:', error);
      throw error;
    }
  }

  // Raporu indir (PDF)
  async downloadReportPDF(reportId) {
    try {
      const response = await fetch(`${this.baseURL}/reports/${reportId}/download?format=pdf`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      debugError('❌ Error downloading PDF report:', error);
      throw error;
    }
  }

  // Raporu indir (Excel)
  async downloadReportExcel(reportId) {
    try {
      const response = await fetch(`${this.baseURL}/reports/${reportId}/download?format=excel`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      debugError('❌ Error downloading Excel report:', error);
      throw error;
    }
  }
}

export default new ReportsAPI(); 