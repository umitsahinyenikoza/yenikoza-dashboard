const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class SettingsAPI {
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

  // Profil bilgilerini al
  async getProfile() {
    try {
      const response = await fetch(`${this.baseURL}/settings/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      debugError('❌ Error fetching profile:', error);
      throw error;
    }
  }

  // Profil bilgilerini güncelle
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseURL}/settings/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.message : null;
    } catch (error) {
      debugError('❌ Error updating profile:', error);
      throw error;
    }
  }

  // Bildirim ayarlarını al
  async getNotificationSettings() {
    try {
      const response = await fetch(`${this.baseURL}/settings/notifications`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      debugError('❌ Error fetching notification settings:', error);
      throw error;
    }
  }

  // Bildirim ayarlarını güncelle
  async updateNotificationSettings(settings) {
    try {
      const response = await fetch(`${this.baseURL}/settings/notifications`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.message : null;
    } catch (error) {
      debugError('❌ Error updating notification settings:', error);
      throw error;
    }
  }

  // Dashboard ayarlarını al
  async getDashboardSettings() {
    try {
      const response = await fetch(`${this.baseURL}/settings/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      debugError('❌ Error fetching dashboard settings:', error);
      throw error;
    }
  }

  // Dashboard ayarlarını güncelle
  async updateDashboardSettings(settings) {
    try {
      const response = await fetch(`${this.baseURL}/settings/dashboard`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.message : null;
    } catch (error) {
      debugError('❌ Error updating dashboard settings:', error);
      throw error;
    }
  }

  // API anahtarlarını al
  async getApiKeys() {
    try {
      const response = await fetch(`${this.baseURL}/settings/api-keys`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      debugError('❌ Error fetching API keys:', error);
      throw error;
    }
  }

  // Yeni API anahtarı oluştur
  async createApiKey(name) {
    try {
      const response = await fetch(`${this.baseURL}/settings/api-keys`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      debugError('❌ Error creating API key:', error);
      throw error;
    }
  }

  // API anahtarını sil
  async deleteApiKey(id) {
    try {
      const response = await fetch(`${this.baseURL}/settings/api-keys/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.message : null;
    } catch (error) {
      debugError('❌ Error deleting API key:', error);
      throw error;
    }
  }

  // Şifre değiştir (gelecekte eklenebilir)
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${this.baseURL}/settings/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.message : null;
    } catch (error) {
      debugError('❌ Error changing password:', error);
      throw error;
    }
  }
}

export default new SettingsAPI(); 