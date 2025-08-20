import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useAlert } from '../contexts/AlertContext';
import { GameService } from '../services/gameService';
import { GAME_CONSTANTS } from '../types';
import type { Session } from '../types';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const { currentSession, updateSession } = useSession();
  const { showSuccess, showError, showInfo } = useAlert();
  const navigate = useNavigate();
  const [canJoin, setCanJoin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastSessionResults, setLastSessionResults] = useState<{
    winningNumber: number;
    winners: Array<{id: number; user: {id: number; fullName?: string; username: string}}>;
    userWon: boolean;
    userPick: number | null;
    totalPlayers: number;
  } | null>(null);
  const [joinReason, setJoinReason] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  // Load current session once on mount
  const loadCurrentSession = useCallback(async () => {
    try {
      const session = await GameService.getCurrentSession();
      updateSession(session);
      
      if (session) {
        updateSessionStatus(session);
        updateCanJoinStatus(session);
        updateCountdown(session);
      } else {
        setCanJoin(false);
        setJoinReason('No session available');
        setCountdown(0);
      }
    } catch (error) {
      console.error('Error loading current session:', error);
      showError('Error loading session data. Please refresh the page.');
      setCanJoin(false);
      setJoinReason('Error loading session');
      setCountdown(0);
    }
  }, [updateSession, showError]);

  // Load session once on mount
  useEffect(() => {
    loadCurrentSession();
  }, [loadCurrentSession]);

  // Update countdown locally without API calls
  const updateCountdown = useCallback((session: Session | null) => {
    if (!session || session.status !== 'ACTIVE') {
      setCountdown(0);
      return;
    }
    
    const timeLeft = GameService.getSessionCountdown(session);
    setCountdown(timeLeft);
    
    // If session just ended, check for results
    if (timeLeft <= 0 && !showResults) {
      checkForResults(session);
    }
  }, [showResults]);

  // No automatic polling - countdown updates only when manually refreshed

  // Optimized join status update with state comparison to prevent flickering
  const updateCanJoinStatus = useCallback((session: Session | null) => {
    if (!session) {
      setCanJoin(prev => prev !== false ? false : prev);
      return;
    }

    // Check if user is already in the session
    const isUserInSession = session.players?.some(player => player.user.id === user?.id);
    
    if (isUserInSession) {
      setCanJoin(prev => prev !== false ? false : prev);
      return;
    }

    // Check session status and timing
    if (session.status === 'PENDING') {
      setCanJoin(prev => prev !== true ? true : prev);
      return;
    }

    if (session.status === 'ACTIVE') {
      if (countdown > 0) {
        // Check if session is full (max 10 players)
        const currentPlayers = session.players?.length || 0;
        
        if (currentPlayers >= GAME_CONSTANTS.MAX_PLAYERS) {
          setCanJoin(prev => prev !== false ? false : prev);
          return;
        }
        
        setCanJoin(prev => prev !== true ? true : prev);
      } else {
        setCanJoin(prev => prev !== false ? false : prev);
      }
      return;
    }

    // Session has ended or other status
    setCanJoin(prev => prev !== false ? false : prev);
  }, [user?.id, countdown]);

  // Check for results after session ends
  const checkForResults = useCallback(async (session: Session) => {
    try {
      // Wait a moment for backend to process results
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endedSession = await GameService.getEndedSessionResults(session.id);
      
      if (endedSession && endedSession.winnerNumber) {
        const winners = endedSession.players.filter(player => player.pick === endedSession.winnerNumber);
        const userWon = winners.some(winner => winner.user.id === user?.id);
        
        const userPlayer = endedSession.players.find(player => player.user.id === user?.id);
        setLastSessionResults({
          winningNumber: endedSession.winnerNumber,
          winners: winners,
          userWon: userWon,
          userPick: userPlayer?.pick || null,
          totalPlayers: endedSession.players.length
        });
        
        setShowResults(true);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowResults(false);
          setLastSessionResults(null);
        }, 10000);
      }
    } catch (error) {
      console.error('Error checking for results:', error);
    }
  }, [user?.id]);

  const updateSessionStatus = (session: Session | null) => {
    if (!session) {
      // setSessionStatus('No active session available'); // This line is removed
      return;
    }

    if (session.status === 'ACTIVE') {
      if (session.startedAt && session.endsAt) {
        // const startTime = new Date(session.startedAt).toLocaleTimeString();
        // const endTime = new Date(session.endsAt).toLocaleTimeString();
        // const timeLeft = GameService.getSessionCountdown(session);
        
        if (countdown > 0) {
          // setSessionStatus(`Active session started at ${startTime}, ends at ${endTime} (${timeLeft}s remaining)`); // This line is removed
        } else {
          // setSessionStatus(`Session ended at ${endTime}`); // This line is removed
        }
      } else {
        // const timeLeft = GameService.getSessionCountdown(session);
        if (countdown > 0) {
          // setSessionStatus(`Active session - ${timeLeft}s remaining`); // This line is removed
        } else {
          // setSessionStatus('Session ending...'); // This line is removed
        }
      }
    } else if (session.status === 'PENDING') {
      if (session.startedAt) {
        // const startTime = new Date(session.startedAt).toLocaleTimeString();
        // setSessionStatus(`Next session will start at ${startTime}`); // This line is removed
      } else {
        // Calculate when session will auto-start (30 seconds after creation)
        const createdAt = new Date(session.createdAt);
        const autoStartTime = new Date(createdAt.getTime() + 30 * 1000); // 30 seconds
        const now = new Date();
        const timeUntilAutoStart = Math.max(0, Math.floor((autoStartTime.getTime() - now.getTime()) / 1000));
        
        if (timeUntilAutoStart > 0) {
          // setSessionStatus(`⏰ Session will auto-start in ${timeUntilAutoStart} seconds ⏰`); // This line is removed
        } else {
          // setSessionStatus('🚀 Session will auto-start soon...'); // This line is removed
        }
      }
    } else {
      // setSessionStatus('Session has ended'); // This line is removed
    }
  };

  const handleJoinGame = async () => {
    if (!canJoin || !currentSession) {
      showError('Cannot join session at this time');
      return;
    }

    setIsLoading(true);
    try {
      // Frontend already validated canJoin status, proceed directly to game
      showInfo('Joining game session...');
      navigate('/game');
      
      // Don't automatically refresh session data - let the game page handle it
    } catch (error) {
      console.error('Error joining game:', error);
      showError('Error joining game. Please try again.');
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
    if (!currentSession || currentSession.status !== 'PENDING') {
      showError('Cannot start session. No pending session available.');
      return;
    }

    setIsLoading(true);
    try {
      await GameService.startSession(currentSession.id);
      showSuccess('Session started successfully! Players can now join.');
      updateSessionStatus(currentSession); // Update status to reflect start
      updateCanJoinStatus(currentSession); // Re-evaluate joinability
      // setSessionStatus('Session started. Players can join.'); // This line is removed
    } catch (error) {
      console.error('Error starting session:', error);
      showError('Error starting session. Please try again.');
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
          <p><strong>Your Pick:</strong> {lastSessionResults.userPick || 'None'}</p>
          <p><strong>Winners:</strong> {lastSessionResults.winners.length}</p>
          {lastSessionResults.userWon ? (
            <p style={{fontWeight: 'bold', fontSize: '1.2rem'}}>🏆 CONGRATULATIONS! You won! 🏆</p>
          ) : (
            <p>Better luck next time! The winning number was {lastSessionResults.winningNumber}</p>
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
              <button className="help-close" onClick={toggleHelp}>×</button>
            </div>
            
            <div className="help-section">
                <h3>How to Play</h3>
                <ol>
                <li><strong>Join a Session:</strong> Click the "Join Game" button when a session is available</li>
                  <li><strong>Pick a Number:</strong> Choose a number between 1-9 when joining</li>
                  <li><strong>Wait for Results:</strong> The session runs for a fixed duration (configurable)</li>
                  <li><strong>Win Condition:</strong> If your number matches the randomly generated winning number, you win!</li>
                </ol>
              </div>
              
            <div className="help-section">
                <h3>Session Rules</h3>
                <ul>
                  <li>Maximum 10 players per session</li>
                  <li>You can leave a session before it starts</li>
                  <li>If you leave, the first person in queue takes your place</li>
                  <li>You cannot join if you already have an active session</li>
                <li>Sessions auto-start after 5 seconds or manually with "Start Session"</li>
                </ul>
              </div>
              
            <div className="help-section">
                <h3>Scoring</h3>
                <ul>
                  <li>Each win adds 1 point to your total wins</li>
                  <li>Check the leaderboard to see top players</li>
                  <li>Winners are determined at the end of each session</li>
                </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="page-header">
        <div className="header-left">
          <div className="game-icon">🎮</div>
          <h1>MBL iGaming</h1>
        </div>
        <div className="header-right">
          <div className="user-greeting">Hi {user?.fullName || user?.username}</div>
          <button className="btn btn-info btn-sm" onClick={toggleHelp}>
            ❓ Help
          </button>
        </div>
      </div>

      <div className="home-top-section">
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Total Wins</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Players in Session</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">10</div>
            <div className="stat-label">Max Players</div>
          </div>
        </div>
      </div>

      <div className="session-section">
        {currentSession ? (
          <div className="session-card">
            <div className="session-header">
              <div className="session-title">
                🎯 Active Session
                <span className={`session-status ${currentSession.status.toLowerCase()}`}>
                  {currentSession.status}
                </span>
                </div>
            </div>
            
            <div className="session-info">
              <div className="info-item">
                <div className="info-label">Status</div>
                <div className="info-value">{currentSession.status}</div>
            </div>
              <div className="info-item">
                <div className="info-label">Players</div>
                <div className="info-value">{currentSession.players?.length || 0}/10</div>
              </div>
              <div className="info-item">
                <div className="info-label">Queue</div>
                <div className="info-value">{currentSession.queue?.length || 0}</div>
              </div>
            </div>

            {currentSession.status === 'ACTIVE' && currentSession.endsAt && (
              <div className="countdown">
                Time Remaining: {Math.max(0, countdown)}s
              </div>
            )}
            
            <div className="session-actions">
              {/* Manual refresh button */}
              <button 
                className="btn btn-outline btn-sm"
                onClick={loadCurrentSession}
                disabled={isLoading}
                style={{ marginBottom: '10px' }}
                title="Check for new sessions"
              >
                🔄 Refresh Session
              </button>
              
              {currentSession?.status === 'PENDING' && (
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={handleStartSession}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Starting Session...
                    </>
                  ) : (
                    'Start Session'
                  )}
                </button>
              )}
              
              {canJoin && currentSession?.status === 'ACTIVE' && (
                <button 
                  className="btn btn-success btn-lg"
                  onClick={handleJoinGame}
                  disabled={isLoading}
                  title={joinReason}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Joining...
                    </>
                  ) : (
                    'Join Game'
                  )}
                </button>
              )}
              
              {!canJoin && currentSession?.status === 'ACTIVE' && (
                <button 
                  className="btn btn-secondary btn-lg"
                  disabled={true}
                  title={joinReason}
                >
                  Cannot Join
                </button>
              )}
              
              {currentSession?.status === 'ENDED' && (
                <button 
                  className="btn btn-outline btn-lg"
                  onClick={handleViewResults}
                >
                  View Results
                </button>
              )}
              
              {/* Optimized system info */}
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginTop: '10px', 
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                ⚡ Optimized: No polling - only checks results when countdown ends
              </div>
            </div>

            {currentSession.players && currentSession.players.length > 0 && (
              <div className="players-section">
                <div className="players-header">
                  <div className="players-title">Players in Session</div>
                  <div className="players-count">{currentSession.players.length}</div>
                </div>
                <div className="players-grid">
                  {currentSession.players.map((player, index) => (
                    <div key={index} className="player-card">
                      <div className="player-name">
                        {player.user.fullName || player.user.username}
                        {player.user.id === user?.id && ' (You)'}
                      </div>
                      {player.pick && <div className="player-pick">Picked: {player.pick}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentSession.queue && currentSession.queue.length > 0 && (
              <div className="queue-section">
                <div className="queue-header">
                  <div className="queue-title">Waiting in Queue</div>
                  <div className="queue-count">{currentSession.queue.length}</div>
                </div>
                <div className="queue-list">
                  {currentSession.queue.map((queuedPlayer, index) => (
                    <div key={index} className="queue-item">
                      {queuedPlayer.user.fullName || queuedPlayer.user.username}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-session">
            <h3>No Active Session</h3>
            <p>There are currently no active gaming sessions available.</p>
            <p>Check back later or create a new session to start playing!</p>
            <button className="btn btn-primary" onClick={handleViewLeaderboard}>
              View Leaderboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 