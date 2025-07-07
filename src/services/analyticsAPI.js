import axios from 'axios';
import { debugLog } from '../utils/debug.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class AnalyticsAPI {
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
        debugLog(`📊 Analytics API Call: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        debugLog(`✅ Analytics API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        debugLog(`❌ Analytics API Response Error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  // Get daily trend data
  async getDailyTrend(days = 7) {
    try {
      const response = await this.axios.get('/analytics/daily-trend', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      debugError('Get daily trend error:', error);
      throw error;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    try {
      const response = await this.axios.get('/analytics/performance');
      return response.data;
    } catch (error) {
      debugError('Get performance metrics error:', error);
      throw error;
    }
  }

  // Get system metrics
  async getSystemMetrics() {
    try {
      const response = await this.axios.get('/analytics/system');
      return response.data;
    } catch (error) {
      debugError('Get system metrics error:', error);
      throw error;
    }
  }

  // Get efficiency score
  async getEfficiencyScore() {
    try {
      const response = await this.axios.get('/analytics/efficiency');
      return response.data;
    } catch (error) {
      debugError('Get efficiency score error:', error);
      throw error;
    }
  }

  // Get store analytics
  async getStoreAnalytics() {
    try {
      const response = await this.axios.get('/analytics/stores');
      return response.data;
    } catch (error) {
      debugError('Get store analytics error:', error);
      throw error;
    }
  }

  // Export analytics data
  async exportAnalytics(filters = {}, format = 'csv') {
    try {
      const response = await this.axios.get('/analytics/export', {
        params: { ...filters, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      debugError('Export analytics error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error) {
      debugError('Analytics API health check error:', error);
      throw error;
    }
  }
}

export const analyticsAPI = new AnalyticsAPI(); 