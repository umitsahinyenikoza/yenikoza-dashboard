import axios from 'axios';
import { debugLog } from '../utils/debug.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class DashboardAPI {
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
        debugLog(`📈 Dashboard API Call: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        debugLog(`✅ Dashboard API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        debugLog(`❌ Dashboard API Response Error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  // Get overview data
  async getOverviewData(dateScope = 'gunluk') {
    try {
      const response = await this.axios.get(`/dashboard/data?scope=${dateScope}`);
      return response.data;
    } catch (error) {
      debugError('Get overview data error:', error);
      throw error;
    }
  }

  // Get alerts
  async getAlerts(dateScope = 'gunluk') {
    try {
      const response = await this.axios.get(`/dashboard/alerts?scope=${dateScope}`);
      return response.data;
    } catch (error) {
      debugError('Get alerts error:', error);
      throw error;
    }
  }

  // Get store status summary
  async getStoreStatusSummary(dateScope = 'gunluk') {
    try {
      debugLog('🔍 Calling getStoreStatusSummary with scope:', dateScope);
      const response = await this.axios.get(`/dashboard/store-status?scope=${dateScope}`);
      debugLog('🔍 Store status API response:', response.data);
      debugLog('🔍 Store status response type:', typeof response.data);
      debugLog('🔍 Store status is array:', Array.isArray(response.data));
      return response.data;
    } catch (error) {
      debugLog('❌ Store status error:', error);
      throw error;
    }
  }

  // Get recent activities
  async getRecentActivities(dateScope = 'gunluk') {
    try {
      const response = await this.axios.get(`/dashboard/activities?scope=${dateScope}`);
      return response.data;
    } catch (error) {
      debugError('Get recent activities error:', error);
      throw error;
    }
  }

  // Get key metrics
  async getKeyMetrics() {
    try {
      const response = await this.axios.get('/dashboard/metrics');
      return response.data;
    } catch (error) {
      debugError('Get key metrics error:', error);
      throw error;
    }
  }

  // Get all dashboard data at once
  async getAllDashboardData() {
    try {
      const response = await this.axios.get('/dashboard/all');
      return response.data;
    } catch (error) {
      debugError('Get all dashboard data error:', error);
      throw error;
    }
  }

  // Mark alert as read
  async markAlertAsRead(alertId) {
    try {
      const response = await this.axios.patch(`/dashboard/alerts/${alertId}/read`);
      return response.data;
    } catch (error) {
      debugError('Mark alert as read error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error) {
      debugError('Dashboard API health check error:', error);
      throw error;
    }
  }
}

export const dashboardAPI = new DashboardAPI(); 