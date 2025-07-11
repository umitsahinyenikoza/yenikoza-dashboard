import axios from 'axios';
import { debugLog, debugError } from '../utils/debug.js';

const SMS_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class SmsAPI {
  constructor() {
    this.axios = axios.create({
      baseURL: SMS_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        debugLog(`📱 SMS API Call: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        debugLog(`✅ SMS API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        debugLog(`❌ SMS API Response Error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  // Get SMS analytics data
  async getSMSAnalytics(params = {}) {
    try {
      const response = await this.axios.get('/sms/analytics', { params });
      return response.data;
    } catch (error) {
      debugError('Get SMS analytics error:', error);
      throw error;
    }
  }

  // Get SMS statistics
  async getSMSStats(params = {}) {
    try {
      const response = await this.axios.get('/sms/stats', { params });
      return response.data;
    } catch (error) {
      debugError('Get SMS stats error:', error);
      throw error;
    }
  }

  // Get hourly SMS distribution
  async getHourlyDistribution(params = {}) {
    try {
      const response = await this.axios.get('/sms/hourly-distribution', { params });
      return response.data;
    } catch (error) {
      debugError('Get hourly distribution error:', error);
      throw error;
    }
  }

  // Get approval types statistics
  async getApprovalTypes(params = {}) {
    try {
      const response = await this.axios.get('/sms/approval-types', { params });
      return response.data;
    } catch (error) {
      debugError('Get approval types error:', error);
      throw error;
    }
  }

  // Get system status
  async getSystemStatus() {
    try {
      const response = await this.axios.get('/sms/system-status');
      return response.data;
    } catch (error) {
      debugError('Get system status error:', error);
      throw error;
    }
  }

  // Send SMS
  async sendSMS(smsData) {
    try {
      const response = await this.axios.post('/sms/send', smsData);
      return response.data;
    } catch (error) {
      debugError('Send SMS error:', error);
      throw error;
    }
  }

  // ✅ Get detailed SMS data (logs + stats)
  async getDetailedSMSData(params = {}) {
    try {
      const response = await this.axios.get('/sms/detailed', { params });
      return response.data;
    } catch (error) {
      debugError('Get detailed SMS data error:', error);
      throw error;
    }
  }

  // ✅ Get SMS error analysis
  async getSMSErrorAnalysis(params = {}) {
    try {
      const response = await this.axios.get('/sms/error-analysis', { params });
      return response.data;
    } catch (error) {
      debugError('Get SMS error analysis error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error) {
      debugError('SMS API health check error:', error);
      throw error;
    }
  }
}

export const smsAPI = new SmsAPI(); 