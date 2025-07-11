import { debugLog, debugError } from '../utils/debug.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AuthAPI {
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      debugError('Login API error:', error);
      throw error;
    }
  }

  async getCurrentUser(token) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user info');
      }

      return data;
    } catch (error) {
      debugError('Get user API error:', error);
      throw error;
    }
  }

  async logout(token) {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Logout failed');
      }

      return data;
    } catch (error) {
      debugError('Logout API error:', error);
      throw error;
    }
  }

  // Token validation
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      // Parse JWT payload without verification (just for expiration check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Local storage helpers
  saveSession(sessionData) {
    localStorage.setItem('authToken', sessionData.token);
    localStorage.setItem('dashboardUser', JSON.stringify(sessionData.user));
    localStorage.setItem('tokenExpiresAt', sessionData.expiresAt);
  }

  getStoredToken() {
    return localStorage.getItem('authToken');
  }

  getStoredUser() {
    try {
      const userData = localStorage.getItem('dashboardUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('dashboardUser');
    localStorage.removeItem('tokenExpiresAt');
  }
}

const authAPI = new AuthAPI();
export default authAPI; 