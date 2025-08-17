import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl, API_CONFIG } from '../config/api';
import type { ApiResponse, User } from '../types';
import Notification from '../components/Notification';
import './AuthPage.css';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

interface AuthData {
  token: string;
  user: User;
}

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      message,
      type,
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleSubmit = async (e: React.FormEvent, action: 'login' | 'register') => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);

    try {
      const endpoint = action === 'register' ? API_CONFIG.ENDPOINTS.AUTH.REGISTER : API_CONFIG.ENDPOINTS.AUTH.LOGIN;
      const requestBody = action === 'register' 
        ? { username: username.trim(), fullName: fullName.trim() || undefined }
        : { username: username.trim() };

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let data: ApiResponse<AuthData>;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (data.status === 'success') {
        if (action === 'register') {
          showNotification('Registration successful! Welcome aboard!', 'success');
          setUsername('');
          setFullName('');
          // Registration successful, auto-login the user
          login(data.data.token, data.data.user);
          navigate('/');
        } else {
          // Login successful
          login(data.data.token, data.data.user);
          navigate('/');
        }
      } else {
        showNotification(data.message || `Failed to ${action}`, 'error');
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      showNotification(error instanceof Error ? error.message : `Failed to ${action}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setUsername('');
    setFullName('');
    setNotification({ message: '', type: 'info', isVisible: false });
  };

  return (
    <div className="auth-page">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        autoHide={true}
        duration={notification.type === 'success' && isRegistering ? 2000 : 5000}
      />
      <div className="auth-container">
        <h1>Welcome to MBL iGaming</h1>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={isLoading}
          />
          
          {isRegistering && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name (optional)"
              disabled={isLoading}
            />
          )}
          
          <div className="auth-buttons">
            {isRegistering ? (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'register')}
                  disabled={isLoading || !username.trim()}
                  className="register-btn"
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="switch-btn"
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'login')}
                  disabled={isLoading || !username.trim()}
                  className="login-btn"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="switch-btn"
                >
                  New User? Register
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage; 