import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { buildApiUrl, API_CONFIG } from '../config/api';
import type { ApiResponse, User } from '../types';
import './AuthPage.css';

interface AuthData {
  token: string;
  user: User;
}

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent, action: 'login' | 'register') => {
    e.preventDefault();
    if (!username.trim()) {
      showError('Username is required');
      return;
    }

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

      const responseText = await response.text();
      let data: ApiResponse<AuthData>;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid response from server`);
      }

      if (data.status === 'success') {
        if (action === 'register') {
          showSuccess('Registration successful! Welcome aboard!');
          setUsername('');
          setFullName('');
          // Registration successful, auto-login the user
          login(data.data.token, data.data.user);
          navigate('/');
        } else {
          // Login successful
          showSuccess('Login successful!');
          login(data.data.token, data.data.user);
          navigate('/');
        }
      } else {
        showError(data.message || `Failed to ${action}`);
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials')) {
          showError('Invalid username. Please check your credentials.');
        } else if (error.message.includes('Username already taken')) {
          showError('Username is already taken. Please choose a different one.');
        } else if (error.message.includes('User has an active session')) {
          showError('You already have an active session. Please wait for it to end.');
        } else {
          showError(error.message);
        }
      } else {
        showError(`Failed to ${action}. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setUsername('');
    setFullName('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🎮 MBL iGaming</h1>
          <p>Join the ultimate gaming experience</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${!isRegistering ? 'active' : ''}`}
            onClick={() => setIsRegistering(false)}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${isRegistering ? 'active' : ''}`}
            onClick={() => setIsRegistering(true)}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, isRegistering ? 'register' : 'login')} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
          <input
              id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
              className="form-input"
              required
            disabled={isLoading}
          />
          </div>
          
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name (Optional)</label>
            <input
                id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="form-input"
              disabled={isLoading}
            />
            </div>
          )}
          
                <button
            type="submit" 
            className={`btn btn-primary btn-full ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {isRegistering ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
                </button>
        </form>

        <div className="auth-footer">
          <p className="text-muted text-center">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
              className="link link-primary ml-2"
                  onClick={toggleMode}
                >
              {isRegistering ? 'Sign In' : 'Create Account'}
                </button>
          </p>
          </div>
      </div>
    </div>
  );
};

export default AuthPage; 