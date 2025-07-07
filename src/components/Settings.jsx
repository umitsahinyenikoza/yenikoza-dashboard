import React, { useState, useEffect } from 'react';
import { User, Bell, Eye, Shield, Key, Save, Edit, Trash2, Plus } from 'lucide-react';
import settingsAPI from '../services/settingsAPI';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // State'ler
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    avatar: '👤'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    errorAlerts: true,
    performanceAlerts: true,
    dailyReports: false,
    weeklyReports: true
  });

  const [dashboardSettings, setDashboardSettings] = useState({
    defaultView: 'overview',
    autoRefresh: true,
    refreshInterval: 30,
    showTrends: true,
    compactMode: false,
    darkMode: false
  });

  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  const tabs = [
    { id: 'profile', label: '👤 Profil', icon: User },
    { id: 'notifications', label: '🔔 Bildirimler', icon: Bell },
    { id: 'dashboard', label: '👁️ Görünüm', icon: Eye },
    { id: 'security', label: '🔐 Güvenlik', icon: Shield }
  ];

  // Component yüklendiğinde verileri al
  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
    loadDashboardSettings();
    loadApiKeys();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await settingsAPI.getProfile();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      debugError('Profil yüklenemedi:', error);
      setError('Profil bilgileri yüklenemedi');
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await settingsAPI.getNotificationSettings();
      if (settings) {
        setNotificationSettings(settings);
      }
    } catch (error) {
      debugError('Bildirim ayarları yüklenemedi:', error);
      setError('Bildirim ayarları yüklenemedi');
    }
  };

  const loadDashboardSettings = async () => {
    try {
      const settings = await settingsAPI.getDashboardSettings();
      if (settings) {
        setDashboardSettings(settings);
      }
    } catch (error) {
      debugError('Dashboard ayarları yüklenemedi:', error);
      setError('Dashboard ayarları yüklenemedi');
    }
  };

  const loadApiKeys = async () => {
    try {
      const keys = await settingsAPI.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      debugError('API anahtarları yüklenemedi:', error);
      setError('API anahtarları yüklenemedi');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const message = await settingsAPI.updateProfile(userProfile);
      setSuccess(message || 'Profil başarıyla güncellendi');
    } catch (error) {
      debugError('Profil güncelleme hatası:', error);
      setError('Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const message = await settingsAPI.updateNotificationSettings(notificationSettings);
      setSuccess(message || 'Bildirim ayarları güncellendi');
    } catch (error) {
      debugError('Bildirim ayarları güncelleme hatası:', error);
      setError('Bildirim ayarları güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDashboard = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const message = await settingsAPI.updateDashboardSettings(dashboardSettings);
      setSuccess(message || 'Dashboard ayarları güncellendi');
    } catch (error) {
      debugError('Dashboard ayarları güncelleme hatası:', error);
      setError('Dashboard ayarları güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      setError('API anahtarı adı gerekli');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const newKey = await settingsAPI.createApiKey(newApiKeyName);
      if (newKey) {
        setApiKeys([...apiKeys, newKey]);
        setNewApiKeyName('');
        setSuccess('API anahtarı oluşturuldu');
      }
    } catch (error) {
      debugError('API anahtarı oluşturma hatası:', error);
      setError('API anahtarı oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id) => {
    if (!window.confirm('Bu API anahtarını silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const message = await settingsAPI.deleteApiKey(id);
      setApiKeys(apiKeys.filter(key => key.id !== id));
      setSuccess(message || 'API anahtarı silindi');
    } catch (error) {
      debugError('API anahtarı silme hatası:', error);
      setError('API anahtarı silinemedi');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('API anahtarı kopyalandı');
    }).catch(() => {
      setError('Kopyalama başarısız');
    });
  };

  const renderProfileTab = () => (
    <div className="settings-tab-content">
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-text">{userProfile.avatar}</span>
          </div>
          <div className="profile-info">
            <h3>{userProfile.name || 'Kullanıcı'}</h3>
            <p className="user-role">{userProfile.role || 'Kullanıcı'}</p>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Ad Soyad</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
            />
          </div>

          <div className="form-group">
            <label>E-posta</label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
              placeholder="E-posta adresiniz"
            />
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              value={userProfile.phone}
              onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Telefon numaranız"
            />
          </div>

          <div className="form-group">
            <label>Rol</label>
            <select
              value={userProfile.role}
              onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="Analyst">Analyst</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <button
            className="save-btn"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={18} />
                Profili Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="settings-tab-content">
      <div className="notifications-section">
        <h3>Bildirim Ayarları</h3>
        
        <div className="notification-options">
          <div className="notification-option">
            <div className="option-info">
              <h4>E-posta Bildirimleri</h4>
              <p>Önemli güncellemeler için e-posta al</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  emailNotifications: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-option">
            <div className="option-info">
              <h4>SMS Bildirimleri</h4>
              <p>Acil durumlar için SMS al</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  smsNotifications: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-option">
            <div className="option-info">
              <h4>Hata Uyarıları</h4>
              <p>Sistem hataları hakkında bilgilendir</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.errorAlerts}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  errorAlerts: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-option">
            <div className="option-info">
              <h4>Performans Uyarıları</h4>
              <p>Performans sorunları hakkında bilgilendir</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.performanceAlerts}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  performanceAlerts: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-option">
            <div className="option-info">
              <h4>Günlük Raporlar</h4>
              <p>Her gün özet rapor al</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.dailyReports}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  dailyReports: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-option">
            <div className="option-info">
              <h4>Haftalık Raporlar</h4>
              <p>Her hafta detaylı rapor al</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.weeklyReports}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  weeklyReports: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <button
          className="save-btn"
          onClick={handleSaveNotifications}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save size={18} />
              Bildirimleri Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderDashboardTab = () => (
    <div className="settings-tab-content">
      <div className="dashboard-settings-section">
        <h3>Dashboard Görünüm Ayarları</h3>
        
        <div className="dashboard-options">
          <div className="form-group">
            <label>Varsayılan Görünüm</label>
            <select
              value={dashboardSettings.defaultView}
              onChange={(e) => setDashboardSettings(prev => ({
                ...prev,
                defaultView: e.target.value
              }))}
            >
              <option value="overview">Genel Bakış</option>
              <option value="customer-analytics">Müşteri Analitik</option>
              <option value="sms">SMS Takip</option>
              <option value="errors">Hata Logları</option>
            </select>
          </div>

          <div className="form-group">
            <label>Otomatik Yenileme</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dashboardSettings.autoRefresh}
                onChange={(e) => setDashboardSettings(prev => ({
                  ...prev,
                  autoRefresh: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="form-group">
            <label>Yenileme Aralığı (saniye)</label>
            <input
              type="number"
              min="10"
              max="300"
              value={dashboardSettings.refreshInterval}
              onChange={(e) => setDashboardSettings(prev => ({
                ...prev,
                refreshInterval: parseInt(e.target.value)
              }))}
              disabled={!dashboardSettings.autoRefresh}
            />
          </div>

          <div className="form-group">
            <label>Trend Verilerini Göster</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dashboardSettings.showTrends}
                onChange={(e) => setDashboardSettings(prev => ({
                  ...prev,
                  showTrends: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="form-group">
            <label>Kompakt Mod</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dashboardSettings.compactMode}
                onChange={(e) => setDashboardSettings(prev => ({
                  ...prev,
                  compactMode: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="form-group">
            <label>Karanlık Mod</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dashboardSettings.darkMode}
                onChange={(e) => setDashboardSettings(prev => ({
                  ...prev,
                  darkMode: e.target.checked
                }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <button
          className="save-btn"
          onClick={handleSaveDashboard}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save size={18} />
              Görünümü Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="settings-tab-content">
      <div className="security-section">
        <h3>API Anahtarları</h3>
        
        <div className="api-keys-header">
          <p>Dashboard ve servisler için API anahtarlarınızı yönetin</p>
          <div className="add-api-key-form">
            <input
              type="text"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              placeholder="API anahtarı adı"
              className="api-key-input"
            />
            <button className="add-api-key-btn" onClick={generateApiKey} disabled={loading}>
              <Plus size={16} />
              Yeni API Anahtarı
            </button>
          </div>
        </div>

        <div className="api-keys-list">
          {apiKeys.length > 0 ? (
            apiKeys.map(key => (
              <div key={key.id} className="api-key-item">
                <div className="api-key-info">
                  <div className="api-key-name">
                    <Key size={16} />
                    <h4>{key.name}</h4>
                  </div>
                  <div className="api-key-details">
                    <code className="api-key-value">{key.key}</code>
                    <div className="api-key-meta">
                      <span>Oluşturulma: {key.created}</span>
                      <span>Son Kullanım: {key.lastUsed}</span>
                    </div>
                  </div>
                </div>
                <div className="api-key-actions">
                  <button className="copy-btn" onClick={() => copyToClipboard(key.key)}>
                    Kopyala
                  </button>
                  <button className="delete-btn" onClick={() => deleteApiKey(key.id)} disabled={loading}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-api-keys">
              <p>Henüz API anahtarı oluşturulmamış</p>
            </div>
          )}
        </div>

        <div className="security-tips">
          <h4>🔒 Güvenlik İpuçları</h4>
          <ul>
            <li>API anahtarlarınızı güvenli tutun ve paylaşmayın</li>
            <li>Kullanılmayan anahtarları düzenli olarak silin</li>
            <li>Şifrenizi en az 8 karakter uzunluğunda yapın</li>
            <li>İki faktörlü kimlik doğrulamayı etkinleştirin</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-title">
          <h1>⚙️ Ayarlar</h1>
          <p>Hesap ve sistem ayarlarınızı yönetin</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="success-message">
          <p>✅ {success}</p>
        </div>
      )}

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.label.split(' ')[0]}</span>
                <span className="nav-label">{tab.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </div>
      </div>
    </div>
  );
};

export default Settings; 