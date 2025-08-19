import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Layout from './components/Layout';
import { AuthContext } from './contexts/AuthContext';
import { SessionContext } from './contexts/SessionContext';
import { AlertProvider } from './contexts/AlertContext';
import type { User, Session } from './types';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  // Check if we have a stored token and user data on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCurrentSession(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateSession = (session: Session | null) => {
    setCurrentSession(session);
  };

  return (
    <AlertProvider>
      <AuthContext.Provider value={{ token, user, login, logout }}>
        <SessionContext.Provider value={{ currentSession, updateSession }}>
          <Router>
            <div className="App">
              <Routes>
                <Route 
                  path="/auth" 
                  element={token && user ? <Navigate to="/" replace /> : <AuthPage />} 
                />
                <Route 
                  path="/" 
                  element={token && user ? <Layout /> : <Navigate to="/auth" replace />} 
                >
                  <Route index element={<HomePage />} />
                  <Route path="game" element={<GamePage />} />
                  <Route path="results" element={<ResultsPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </SessionContext.Provider>
      </AuthContext.Provider>
    </AlertProvider>
  );
}

export default App;
