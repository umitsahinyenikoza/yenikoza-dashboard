import { debugLog, debugError } from "../utils/debug.js";
import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, User, Lock, AlertCircle } from 'lucide-react';
import authAPI from '../services/authAPI';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call backend API
      const response = await authAPI.login(credentials.username, credentials.password);
      
      if (response.success) {
        // Save session data
        authAPI.saveSession(response);
        
        // Create user session object for compatibility
        const userSession = {
          ...response.user,
          loginTime: new Date().toISOString(),
          token: response.token
        };
        
        debugLog(`✅ User ${response.user.username} logged in successfully`);
        
        // Call parent callback
        onLogin(userSession);
      } else {
        setError(response.error || 'Giriş başarısız');
      }
      
    } catch (error) {
      debugError('Login error:', error);
      setError(error.message || 'Sunucu hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <LogIn size={32} className="text-blue-600" />
            </div>
            <h1 className="login-title">YeniKoza Dashboard</h1>
            <p className="login-subtitle">Analitik ve İzleme Sistemi</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <User size={16} />
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="Kullanıcı adınızı girin"
                className="form-input"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <Lock size={16} />
                Şifre
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  placeholder="Şifrenizi girin"
                  className="form-input"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                  aria-label="Şifreyi göster/gizle"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 