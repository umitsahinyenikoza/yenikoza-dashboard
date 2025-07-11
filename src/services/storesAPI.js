import axios from 'axios';
import { debugLog, debugError } from '../utils/debug.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class StoresAPI {
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
        debugLog(`🏪 Stores API Call: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        debugLog(`✅ Stores API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        debugLog(`❌ Stores API Response Error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  // Get all stores
  async getStores() {
    try {
      const response = await this.axios.get('/stores');
      return response.data;
    } catch (error) {
      debugError('Get stores error:', error);
      throw error;
    }
  }

  // Get store status for all stores
  async getStoreStatus() {
    try {
      const response = await this.axios.get('/stores/status');
      return response.data;
    } catch (error) {
      debugError('Get store status error:', error);
      throw error;
    }
  }

  // Get store by ID
  async getStoreById(storeId) {
    try {
      const response = await this.axios.get(`/stores/${storeId}`);
      return response.data;
    } catch (error) {
      debugError('Get store by ID error:', error);
      throw error;
    }
  }

  // Get store summary statistics
  async getStoreSummary() {
    try {
      const response = await this.axios.get('/stores/summary');
      return response.data;
    } catch (error) {
      debugError('Get store summary error:', error);
      throw error;
    }
  }

  // Update store status
  async updateStoreStatus(storeId, status) {
    try {
      const response = await this.axios.patch(`/stores/${storeId}/status`, { status });
      return response.data;
    } catch (error) {
      debugError('Update store status error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error) {
      debugError('Stores API health check error:', error);
      throw error;
    }
  }
}

export const storesAPI = new StoresAPI(); 