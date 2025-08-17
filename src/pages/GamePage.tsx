import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import { GameService } from '../services/gameService';
import { GAME_CONSTANTS } from '../types';
import './GamePage.css';

const GamePage = () => {
  const { currentSession } = useSession();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [usersJoined, setUsersJoined] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    winningNumber: number | null;
    winners: Array<{id: number; user: {id: number; fullName?: string; username: string}}>;
    userWon: boolean;
    userPick: number | null;
    totalPlayers: number;
  } | null>(null);
  const [showResultsCountdown, setShowResultsCountdown] = useState(false);

  useEffect(() => {
    if (!currentSession) {
      navigate('/');
      return;
    }

    if (currentSession.players) {
      setUsersJoined(currentSession.players.length);
      // Check if user is already in the session
      const userInSession = currentSession.players.find(player => player.user.id === user?.id);
      setHasJoined(!!userInSession);
    }

    // Calculate initial time left based on session end time
    if (currentSession.status === 'ACTIVE' && currentSession.endsAt) {
      const timeLeft = GameService.getSessionCountdown(currentSession);
      setTimeLeft(timeLeft);
    }

    // Start countdown timer based on actual session end time
    const timer = setInterval(() => {
      if (currentSession && currentSession.status === 'ACTIVE' && currentSession.endsAt) {
        const timeLeft = GameService.getSessionCountdown(currentSession);
        setTimeLeft(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          showSessionResults().catch(error => {
            console.error('Error showing session results:', error);
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession, user, navigate]);

  const showSessionResults = async () => {
    if (!currentSession) return;
    
    // Show loading state and countdown
    setShowResultsCountdown(true);
    
    // Wait 2 seconds before fetching results
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Fetch the actual ended session results from the backend
      const endedSession = await GameService.getEndedSessionResults(currentSession.id);
      
      if (endedSession) {
        // Use the actual ended session data from the backend
        const winners = endedSession.players.filter(player => player.pick === endedSession.winnerNumber);
        const userWon = winners.some(winner => winner.user.id === user?.id);
        
        setSessionResults({
          winningNumber: endedSession.winnerNumber,
          winners: winners,
          userWon: userWon,
          userPick: selectedNumber,
          totalPlayers: endedSession.players.length
        });
      } else {
        // Fallback to local state if backend fetch fails
        const winners = currentSession.players.filter(player => player.pick === currentSession.winnerNumber);
        const userWon = winners.some(winner => winner.user.id === user?.id);
        
        setSessionResults({
          winningNumber: currentSession.winnerNumber,
          winners: winners,
          userWon: userWon,
          userPick: selectedNumber,
          totalPlayers: currentSession.players.length
        });
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching session results:', error);
      // Fallback to local state if there's an error
      const winners = currentSession.players.filter(player => player.pick === currentSession.winnerNumber);
      const userWon = winners.some(winner => winner.user.id === user?.id);
      
      setSessionResults({
        winningNumber: currentSession.winnerNumber,
        winners: winners,
        userWon: userWon,
        userPick: selectedNumber,
        totalPlayers: currentSession.players.length
      });
      
      setShowResults(true);
    } finally {
      setShowResultsCountdown(false);
    }
  };

  // Show results display when session ends
  if (showResults && sessionResults) {
    return (
      <div className="game-page">
        <div className="results-display">
          <h2>🎉 Session Results! 🎉</h2>
          
          <div className="winning-number-result">
            <h3>The Winning Number Was:</h3>
            {sessionResults.winningNumber ? (
              <div className="winner-number">{sessionResults.winningNumber}</div>
            ) : (
              <div className="no-winner-number">No winning number (session ended without players)</div>
            )}
          </div>
          
          <div className="user-result">
            <h3>Your Result:</h3>
            <p>You picked: <strong>{sessionResults.userPick}</strong></p>
            {sessionResults.winningNumber ? (
              sessionResults.userWon ? (
                <div className="winner-message">
                  🏆 CONGRATULATIONS! You won! 🏆
                </div>
              ) : (
                <div className="loser-message">
                  😔 Better luck next time! The winning number was {sessionResults.winningNumber}
                </div>
              )
            ) : (
              <div className="no-winner-message">
                ℹ️ Session ended without a winning number
              </div>
            )}
          </div>
          
          <div className="winners-list">
            <h3>Winners ({sessionResults.winners.length}):</h3>
            {sessionResults.winners.length > 0 ? (
              <ul>
                {sessionResults.winners.map((winner) => (
                  <li key={winner.id} className="winner-item">
                    🏆 {winner.user.fullName || winner.user.username}
                    {winner.user.id === user?.id && ' (You!)'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No winners this round!</p>
            )}
          </div>
          
          <div className="session-stats">
            <p>Total players: {sessionResults.totalPlayers}</p>
            <p>Winners: {sessionResults.winners.length}</p>
          </div>
          
          <div className="results-actions">
            <button 
              className="home-btn"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
            
            <button 
              className="leaderboard-btn"
              onClick={() => currentSession && navigate(`/results?sessionId=${currentSession.id}`)}
            >
              View Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading animation when session ends and we're waiting for results
  if (showResultsCountdown) {
    return (
      <div className="game-page">
        <div className="results-loading">
          <div className="loading-animation">
            <div className="spinner"></div>
            <h2>🎯 Session Ended! 🎯</h2>
            <p>Calculating results...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="loading-message">Please wait while we determine the winners!</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNumberSubmit = async () => {
    if (!selectedNumber || !currentSession || hasJoined) return;

    // Validate number pick (1-9)
    if (!GameService.validatePick(selectedNumber)) {
      setError('Please pick a number between 1 and 9');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await GameService.joinSession(selectedNumber);
      
      if (result.success) {
        setHasJoined(true);
        setError(null);
        // Update the session context with the new session data
        if (result.session) {
          // You might want to update the session context here
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join session. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSession = async () => {
    if (!currentSession || !hasJoined) return;

    try {
      const result = await GameService.leaveSession(currentSession.id);
      if (result.success) {
        setHasJoined(false);
        setSelectedNumber(null);
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error leaving session:', error);
      setError('Failed to leave session.');
    }
  };

  const canPickNumber = !hasJoined && currentSession?.status === 'ACTIVE' && timeLeft > 0;

  if (!currentSession) {
    return <div className="loading">Loading game session...</div>;
  }

  return (
    <div className="game-page">
      <div className="countdown-section">
        <h2>Game Session</h2>
        
        {currentSession && currentSession.startedAt && currentSession.endsAt && (
          <div className="session-timing">
            <div className="time-info">
              <strong>Started:</strong> {new Date(currentSession.startedAt).toLocaleTimeString()}
            </div>
            <div className="time-info">
              <strong>Ends:</strong> {new Date(currentSession.endsAt).toLocaleTimeString()}
            </div>
            <div className="time-info">
              <strong>Duration:</strong> {Math.round((new Date(currentSession.endsAt).getTime() - new Date(currentSession.startedAt).getTime()) / 1000)} seconds
            </div>
          </div>
        )}
        
        <div className="countdown-timer">
          <h3>Time Remaining: {timeLeft}s</h3>
        </div>
      </div>

      <div className="game-instruction">
        Pick a random number from {GAME_CONSTANTS.MIN_PICK} - {GAME_CONSTANTS.MAX_PICK}
      </div>
      
      {canPickNumber && (
        <>
          <input
            type="number"
            className="number-input"
            min={GAME_CONSTANTS.MIN_PICK}
            max={GAME_CONSTANTS.MAX_PICK}
            placeholder={`Enter number (${GAME_CONSTANTS.MIN_PICK}-${GAME_CONSTANTS.MAX_PICK})`}
            value={selectedNumber || ''}
            onChange={(e) => setSelectedNumber(parseInt(e.target.value))}
            disabled={isJoining}
          />
          
          <button
            className="join-session-btn"
            onClick={handleNumberSubmit}
            disabled={!selectedNumber || isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </>
      )}

      {hasJoined && (
        <div className="joined-status">
          <div className="success-message">✅ You've joined the session!</div>
          <div className="your-pick">Your pick: {selectedNumber}</div>
          <button
            className="leave-session-btn"
            onClick={handleLeaveSession}
          >
            Leave Session
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      <div className="session-info">
        <div className="users-joined">
          Players: {usersJoined}/{GAME_CONSTANTS.MAX_PLAYERS}
        </div>
        
        {currentSession.players && currentSession.players.length > 0 && (
          <div className="players-list">
            <h4>Players in Session:</h4>
            <div className="players-grid">
              {currentSession.players.map((player, index) => (
                <div key={index} className="player-item">
                  <span className="player-name">
                    {player.user.fullName || player.user.username}
                  </span>
                  {player.isWinner && <span className="winner-badge">🏆</span>}
                  {player.user.id === user?.id && <span className="you-badge">(You)</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="game-actions">
        <button 
          className="results-btn"
          onClick={() => navigate('/results')}
        >
          View Results
        </button>
        
        <button 
          className="home-btn"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default GamePage; 