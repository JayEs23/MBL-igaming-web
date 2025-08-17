import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameService } from '../services/gameService';
import type { Session, SessionPlayer } from '../types';
import './ResultsPage.css';

const ResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
    startCountdown();
  }, []);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get session ID from URL parameters
      const sessionId = searchParams.get('sessionId');
      
      if (sessionId) {
        // Fetch specific ended session
        const session = await GameService.getEndedSessionResults(parseInt(sessionId));
        if (session) {
          setSessionData(session);
        } else {
          setError('Session not found or not ended yet');
        }
      } else {
        // Try to get current session as fallback
        const currentSession = await GameService.getCurrentSession();
        if (currentSession && currentSession.status === 'ENDED') {
          setSessionData(currentSession);
        } else {
          setError('No ended session found to display results');
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setError('Failed to load session results');
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/');
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (isLoading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!sessionData) {
    return <div className="no-data-message">No session data available.</div>;
  }

  const winners = sessionData.players?.filter((p: SessionPlayer) => p.isWinner) || [];
  const totalPlayers = sessionData.players?.length || 0;
  const totalWins = winners.length;

  return (
    <div className="results-page">
      <div className="results-top-section">
        <div className="results-header">
          <h1>🏆 Session Results</h1>
          <p className="results-subtitle">Game Session Summary</p>
        </div>
        
        <div className="results-controls">
          <div className="results-actions">
            <button 
              className="home-btn" 
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>
            
            <button 
              className="leaderboard-btn" 
              onClick={() => navigate('/leaderboard')}
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </div>

      <div className="results-content">
        <div className="results-panel">
          <h3>Active users in session</h3>
          <div className="user-list">
            {sessionData.players?.map((player: SessionPlayer, index: number) => (
              <div key={index} className="user-item">
                {player.user?.username || 'Unknown'}
              </div>
            ))}
          </div>
        </div>
        
        <div className="results-panel center">
          <h3>Result</h3>
          <div className="winning-number">{sessionData.winnerNumber || '-'}</div>
          <div className="stats-small">total players: {totalPlayers}</div>
          <div className="stats-small">total wins: {totalWins}</div>
          <div className="countdown-message">
            {countdown > 0 
              ? `new session starts in ${countdown}...`
              : 'new session starting...'
            }
          </div>
        </div>
        
        <div className="results-panel">
          <h3>Winners</h3>
          <div className="user-list">
            {winners.map((player: SessionPlayer, index: number) => (
              <div key={index} className="user-item">
                {player.user?.username || 'Unknown'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 