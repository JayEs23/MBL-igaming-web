import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { GameService } from '../services/gameService';
import { GAME_CONSTANTS } from '../types';
import type { Session } from '../types';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const { currentSession, updateSession } = useSession();
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastSessionResults, setLastSessionResults] = useState<{
    winningNumber: number;
    winners: Array<{id: number; user: {id: number; fullName?: string; username: string}}>;
    userWon: boolean;
    totalPlayers: number;
  } | null>(null);
  const [countdownTime, setCountdownTime] = useState<number>(0);

  useEffect(() => {
    loadCurrentSession();
    // Poll every 3 seconds instead of 5 seconds for more responsive updates
    const interval = setInterval(loadCurrentSession, 3000);
    return () => clearInterval(interval);
  }, []);

  // Separate effect for local countdown updates (no backend calls)
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'ACTIVE') return;
    
    const countdownInterval = setInterval(() => {
      if (currentSession) {
        updateSessionStatus(currentSession);
        updateCanJoinStatus(currentSession);
        
        // Check if session just ended
        const timeLeft = GameService.getSessionCountdown(currentSession);
        if (timeLeft <= 0 && !showResults) {
          showSessionResultsNotification(currentSession).catch(error => {
            console.error('Error showing session results notification:', error);
          });
        }
      }
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [currentSession, showResults]);

  // Separate effect for auto-start countdown
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'PENDING') return;
    
    const autoStartInterval = setInterval(() => {
      if (currentSession && currentSession.status === 'PENDING') {
        updateSessionStatus(currentSession);
      }
    }, 1000);
    
    return () => clearInterval(autoStartInterval);
  }, [currentSession]);

  // Effect to refresh session data when player count changes
  useEffect(() => {
    if (!currentSession) return;
    
    // Refresh session data when player count changes to ensure real-time updates
    const sessionId = currentSession.id;
    
    const refreshInterval = setInterval(() => {
      // Only refresh if we're still on the same session
      if (currentSession && currentSession.id === sessionId) {
        loadCurrentSession();
      }
    }, 2000); // Refresh every 2 seconds when session is active
    
    return () => clearInterval(refreshInterval);
  }, [currentSession?.id, currentSession?.players?.length]);

  // Effect to update countdown timer for pending sessions
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'PENDING' || currentSession.startedAt) return;
    
    const countdownInterval = setInterval(() => {
      const createdAt = new Date(currentSession.createdAt);
      const autoStartTime = new Date(createdAt.getTime() + 30000);
      const now = new Date();
      const timeUntilAutoStart = Math.max(0, Math.floor((autoStartTime.getTime() - now.getTime()) / 1000));
      
      setCountdownTime(timeUntilAutoStart);
      
      if (timeUntilAutoStart <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [currentSession?.id, currentSession?.status, currentSession?.startedAt, currentSession?.createdAt]);

  const loadCurrentSession = async () => {
    try {
      const session = await GameService.getCurrentSession();
      
      updateSession(session);
      updateSessionStatus(session);
      updateCanJoinStatus(session);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const updateSessionStatus = (session: Session | null) => {
    if (!session) {
      setSessionStatus('No active session available');
      return;
    }

    if (session.status === 'ACTIVE') {
      const timeLeft = GameService.getSessionCountdown(session);
      
      if (session.startedAt && session.endsAt) {
        const startTime = new Date(session.startedAt).toLocaleTimeString();
        const endTime = new Date(session.endsAt).toLocaleTimeString();
        
        if (timeLeft > 0) {
          setSessionStatus(`Active session started at ${startTime}, ends at ${endTime} (${timeLeft}s remaining)`);
        } else {
          setSessionStatus(`Session ended at ${endTime}`);
        }
      } else {
        if (timeLeft > 0) {
          setSessionStatus(`Active session - ${timeLeft}s remaining`);
        } else {
          setSessionStatus('Session ending...');
        }
      }
    } else if (session.status === 'PENDING') {
      if (session.startedAt) {
        const startTime = new Date(session.startedAt).toLocaleTimeString();
        setSessionStatus(`Next session will start at ${startTime}`);
      } else {
        // Calculate when session will auto-start (30 seconds after creation)
        const createdAt = new Date(session.createdAt);
        const autoStartTime = new Date(createdAt.getTime() + 30000);
        const now = new Date();
        const timeUntilAutoStart = Math.max(0, Math.floor((autoStartTime.getTime() - now.getTime()) / 1000));
        
        if (timeUntilAutoStart > 0) {
          setSessionStatus(`⏰ Session will auto-start in ${timeUntilAutoStart} seconds ⏰`);
        } else {
          setSessionStatus('🚀 Session will auto-start soon...');
        }
      }
    } else {
      setSessionStatus('Session has ended');
    }
  };

  const updateCanJoinStatus = (session: Session | null) => {
    if (!session) {
      setCanJoin(false);
      return;
    }

    // Check if user is already in the session
    const isUserInSession = session.players?.some(player => player.user.id === user?.id);
    
    if (isUserInSession) {
      setCanJoin(false);
      return;
    }

    // Check session status and timing
    if (session.status === 'PENDING') {
      setCanJoin(true);
      return;
    }

    if (session.status === 'ACTIVE') {
      const timeLeft = GameService.getSessionCountdown(session);
      
      if (timeLeft > 0) {
        // Check if session is full (max 10 players)
        const currentPlayers = session.players?.length || 0;
        
        if (currentPlayers >= GAME_CONSTANTS.MAX_PLAYERS) {
          setCanJoin(false);
          return;
        }
        
        setCanJoin(true);
      } else {
        setCanJoin(false);
      }
      return;
    }

    // Session has ended or other status
    setCanJoin(false);
  };

  const showSessionResultsNotification = async (session: Session) => {
    try {
      // Fetch the actual ended session results from the backend
      const endedSession = await GameService.getEndedSessionResults(session.id);
      
      if (endedSession && endedSession.winnerNumber) {
        // Use the actual ended session data from the backend
        const winners = endedSession.players.filter(player => player.pick === endedSession.winnerNumber);
        const userWon = winners.some(winner => winner.user.id === user?.id);
        
        setLastSessionResults({
          winningNumber: endedSession.winnerNumber,
          winners: winners,
          userWon: userWon,
          totalPlayers: endedSession.players.length
        });
      } else if (session.winnerNumber) {
        // Fallback to local state if backend fetch fails
        const winners = session.players.filter(player => player.pick === session.winnerNumber);
        const userWon = winners.some(winner => winner.user.id === user?.id);
        
        setLastSessionResults({
          winningNumber: session.winnerNumber,
          winners: winners,
          userWon: userWon,
          totalPlayers: session.players.length
        });
      } else {
        // No winning number available
        return;
      }
      
      setShowResults(true);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setShowResults(false);
        setLastSessionResults(null);
      }, 10000);
    } catch (error) {
      console.error('Error fetching session results:', error);
      // Fallback to local state if there's an error
      if (session.winnerNumber) {
        const winners = session.players.filter(player => player.pick === session.winnerNumber);
        const userWon = winners.some(winner => winner.user.id === user?.id);
        
        setLastSessionResults({
          winningNumber: session.winnerNumber,
          winners: winners,
          userWon: userWon,
          totalPlayers: session.players.length
        });
        
        setShowResults(true);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowResults(false);
          setLastSessionResults(null);
        }, 10000);
      }
    }
  };

  const handleJoinGame = async () => {
    if (!canJoin || !currentSession) return;

    setIsLoading(true);
    try {
      // Frontend already validated canJoin status, proceed directly to game
      navigate('/game');
      
      // Refresh session data after navigation
      setTimeout(() => {
        loadCurrentSession();
      }, 100);
    } catch (error) {
      console.error('Error joining game:', error);
      setSessionStatus('Error joining game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = () => {
    if (currentSession) {
      navigate(`/results?sessionId=${currentSession.id}`);
    } else {
      navigate('/results');
    }
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  const handleStartSession = async () => {
    if (!currentSession || currentSession.status !== 'PENDING') return;

    setIsLoading(true);
    try {
      await GameService.startSession(currentSession.id);
      updateSessionStatus(currentSession); // Update status to reflect start
      updateCanJoinStatus(currentSession); // Re-evaluate joinability
      setSessionStatus('Session started. Players can join.');
    } catch (error) {
      console.error('Error starting session:', error);
      setSessionStatus('Error starting session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  return (
    <div className="home-page">
      {/* Session Results Notification */}
      {showResults && lastSessionResults && (
        <div className="results-notification" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#28a745',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <h3>🎉 Session Ended! 🎉</h3>
          <p><strong>Winning Number:</strong> {lastSessionResults.winningNumber}</p>
          <p><strong>Winners:</strong> {lastSessionResults.winners.length}</p>
          {lastSessionResults.userWon ? (
            <p style={{fontWeight: 'bold', fontSize: '1.2rem'}}>🏆 CONGRATULATIONS! You won! 🏆</p>
          ) : (
            <p>Better luck next time!</p>
          )}
          <button 
            onClick={() => setShowResults(false)}
            style={{
              background: 'white',
              color: '#28a745',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="help-modal-overlay" onClick={toggleHelp}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h2>🎮 Game Rules</h2>
              <button className="help-close-btn" onClick={toggleHelp}>×</button>
            </div>
            <div className="help-content">
              <div className="rule-section">
                <h3>How to Play</h3>
                <ol>
                  <li><strong>Join a Session:</strong> Click the "JOIN" button when a session is available</li>
                  <li><strong>Pick a Number:</strong> Choose a number between 1-9 when joining</li>
                  <li><strong>Wait for Results:</strong> The session runs for a fixed duration (configurable)</li>
                  <li><strong>Win Condition:</strong> If your number matches the randomly generated winning number, you win!</li>
                </ol>
              </div>
              
              <div className="rule-section">
                <h3>Session Rules</h3>
                <ul>
                  <li>Maximum 10 players per session</li>
                  <li>You can leave a session before it starts</li>
                  <li>If you leave, the first person in queue takes your place</li>
                  <li>You cannot join if you already have an active session</li>
                  <li>Sessions auto-start after 5 seconds or manually with "START SESSION"</li>
                </ul>
              </div>
              
              <div className="rule-section">
                <h3>Scoring</h3>
                <ul>
                  <li>Each win adds 1 point to your total wins</li>
                  <li>Check the leaderboard to see top players</li>
                  <li>Winners are determined at the end of each session</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="page-header">
        <div className="header-left">
          <span className="game-icon">🎮</span>
          <h1>MBL iGaming</h1>
        </div>
        <div className="header-right">
          <span className="user-greeting">Hi {user?.fullName || user?.username}</span>
          <button className="help-btn" onClick={toggleHelp}>❓ Help</button>
        </div>
      </div>

      <div className="home-top-section">
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-value">{user?.wins || 0}</div>
            <div className="stat-label">Total Wins</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{currentSession?.players?.length || 0}</div>
            <div className="stat-label">Players in Session</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{GAME_CONSTANTS.MAX_PLAYERS}</div>
            <div className="stat-label">Max Players</div>
          </div>
        </div>

        <div className="home-controls">
          <div className="action-buttons">
            <button 
              className="join-btn" 
              onClick={handleJoinGame}
              disabled={!canJoin || isLoading}
            >
              {isLoading ? 'JOINING...' : canJoin ? 'JOIN' : 'CANNOT JOIN'}
            </button>
            
            <button 
              className="results-btn" 
              onClick={handleViewResults}
              disabled={!currentSession}
            >
              VIEW RESULTS
            </button>
            
            <button 
              className="leaderboard-btn" 
              onClick={handleViewLeaderboard}
            >
              LEADERBOARD
            </button>
          </div>
        </div>
      </div>

      <div className="session-info">
        <h2>Current Session</h2>
        {currentSession ? (
          <div className="session-details">
            <div className="session-status">
              <strong>Status:</strong> {sessionStatus}
            </div>
            
            <div className="session-timing-row">
              {currentSession.startedAt && (
                <div className="session-time">
                  <strong>Started:</strong> {new Date(currentSession.startedAt).toLocaleTimeString()}
                </div>
              )}
              
              {currentSession.endsAt && (
                <div className="session-time">
                  <strong>Ends:</strong> {new Date(currentSession.endsAt).toLocaleTimeString()}
                </div>
              )}
              
              {currentSession.startedAt && currentSession.endsAt && (
                <div className="session-duration">
                  <strong>Duration:</strong> {Math.round((new Date(currentSession.endsAt).getTime() - new Date(currentSession.startedAt).getTime()) / 1000)} seconds
                </div>
              )}
            </div>
            
            <div className="session-players">
              <strong>Players:</strong> {currentSession.players?.length || 0} / {currentSession.maxPlayers || 10}
            </div>
            
            {/* Show countdown for pending sessions */}
            {currentSession.status === 'PENDING' && !currentSession.startedAt && countdownTime > 0 && (
              <div className="session-countdown">
                <div className="countdown-display">
                  <strong>⏰ Auto-start in:</strong>
                  <span className="countdown-timer">{countdownTime}s</span>
                </div>
              </div>
            )}
            
            {currentSession.startedBy && (
              <div className="session-starter">
                <strong>Started by:</strong> {currentSession.startedBy.fullName || currentSession.startedBy.username}
              </div>
            )}
            
            {currentSession.players && currentSession.players.length > 0 ? (
              <div className="players-list">
                <strong>Players in session:</strong>
                <ul>
                  {currentSession.players.map((player) => (
                    <li key={player.id}>
                      {player.user.fullName || player.user.username}
                      {player.user.id === user?.id && ' (You)'}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="no-players">No players have joined yet</div>
            )}
            
            <div className="session-actions">
              <button 
                className="refresh-btn" 
                onClick={loadCurrentSession}
                disabled={isLoading}
              >
                🔄 Refresh
              </button>
              
              {currentSession?.status === 'PENDING' && (
                <button 
                  className="start-btn" 
                  onClick={handleStartSession}
                  disabled={isLoading}
                >
                  🚀 START SESSION
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="no-session">No session available</div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 