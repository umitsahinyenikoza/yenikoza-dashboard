import axios from 'axios';
import { debugLog, debugError } from '../utils/debug.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class LoggingAPI {
  constructor() {
    this.axios = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        debugLog(`🔌 API Call: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        debugLog(`✅ API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        debugLog(`❌ API Response Error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  // Get all logs with optional filters
  async getLogs(filters = {}) {
    try {
      debugLog('🔍 getLogs called with filters:', filters);
      const response = await this.axios.get('/logs', {
        params: filters
      });
      debugLog('🔍 getLogs response:', response.data);
      debugLog('🔍 getLogs response type:', typeof response.data);
      debugLog('🔍 getLogs is array:', Array.isArray(response.data));
      return response.data;
    } catch (error) {
      debugLog('❌ Get logs error:', error);
      throw error;
    }
  }

  // Get log statistics
  async getLogStats(params = {}) {
    try {
      const response = await this.axios.get('/logs/stats', { params });
      return response.data;
    } catch (error) {
      debugError('Get log stats error:', error);
      throw error;
    }
  }

  // Get available log categories
  async getLogCategories() {
    try {
      const response = await this.axios.get('/logs/categories');
      return response.data;
    } catch (error) {
      debugError('Get log categories error:', error);
      throw error;
    }
  }

  // Get log by ID
  async getLogById(logId) {
    try {
      const response = await this.axios.get(`/logs/${logId}`);
      return response.data;
    } catch (error) {
      debugError('Get log by ID error:', error);
      throw error;
    }
  }

  // Create new log entry
  async createLog(logData) {
    try {
      const response = await this.axios.post('/logs', logData);
      return response.data;
    } catch (error) {
      debugError('Create log error:', error);
      throw error;
    }
  }

  // Delete log by ID
  async deleteLog(logId) {
    try {
      const response = await this.axios.delete(`/logs/${logId}`);
      return response.data;
    } catch (error) {
      debugError('Delete log error:', error);
      throw error;
    }
  }

  async getDashboardData() {
    try {
      const response = await this.axios.get('/dashboard/data');
      return response.data;
    } catch (error) {
      debugError('Dashboard data fetch error:', error);
      throw error;
    }
  }

  async exportLogs(filters = {}) {
    try {
      const response = await this.axios.get('/logs/export', {
        params: filters,
        responseType: 'blob' // For file download
      });
      return response.data;
    } catch (error) {
      debugError('Logs export error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error) {
      debugError('Health check error:', error);
      throw error;
    }
  }

  // Test logging service connection
  async testConnection() {
    try {
      await this.healthCheck();
      debugLog('✅ Logging service connection OK');
      return true;
    } catch (error) {
      debugLog('❌ Logging service connection failed:', error);
      return false;
    }
  }

  // 🚫 Get customer rejection reasons analysis
  async getRejectionReasons(params = {}) {
    try {
      const response = await this.axios.get('/customer/rejection-reasons', { params });
      return response.data;
    } catch (error) {
      debugError('Get rejection reasons error:', error);
      throw error;
    }
  }

  // 📊 Get customer analytics
  async getCustomerAnalytics(params = {}) {
    try {
      const response = await this.axios.get('/customer/analytics', { params });
      return response.data;
    } catch (error) {
      debugError('Get customer analytics error:', error);
      throw error;
    }
  }

  // 👤 Get logs with plasiyer information
  async getLogsWithPlasiyerInfo(filters = {}) {
    try {
      const response = await this.axios.get('/logs', {
        params: {
          ...filters,
          include_plasiyer: true // Plasiyer bilgilerini dahil et
        }
      });
      return response.data;
    } catch (error) {
      debugError('Get logs with plasiyer info error:', error);
      throw error;
    }
  }
}

export const loggingAPI = new LoggingAPI(); 