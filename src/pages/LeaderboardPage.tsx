import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from '../services/gameService';
import type { LeaderboardPlayer, LeaderboardPeriod } from '../types';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [period, setPeriod] = useState<LeaderboardPeriod>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const leaderboardData = await GameService.getLeaderboard(period);
      setPlayers(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getPeriodLabel = (period: LeaderboardPeriod) => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'Overall';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-top-section">
        <div className="leaderboard-header">
          <h1>🏆 Leaderboard</h1>
          <p className="leaderboard-subtitle">Top 10 Players by Wins</p>
        </div>
        
        <div className="leaderboard-controls">
          <div className="leaderboard-filters">
            <div className="filter-group">
              <label htmlFor="period-select">Time Period:</label>
              <select 
                id="period-select"
                value={period} 
                onChange={(e) => handlePeriodChange(e.target.value as LeaderboardPeriod)}
                className="period-select"
              >
                <option value="">Overall</option>
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div className="current-period">
              <span className="period-label">Showing:</span>
              <span className="period-value">{getPeriodLabel(period)}</span>
            </div>
          </div>
          
          <div className="leaderboard-actions">
            <button 
              className="home-btn" 
              onClick={handleGoHome}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="leaderboard-content">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : players.length > 0 ? (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-header">Rank</th>
                  <th className="player-header">Player</th>
                  <th className="wins-header">Wins</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player.id} className={`rank-${index + 1}`}>
                    <td className="rank-cell">
                      <span className="rank-icon">{getRankIcon(index + 1)}</span>
                    </td>
                    <td className="player-cell">
                      <div className="player-info">
                        <span className="player-name">
                          {player.fullName || player.username}
                        </span>
                        {player.fullName && (
                          <span className="player-username">@{player.username}</span>
                        )}
                      </div>
                    </td>
                    <td className="wins-cell">
                      <span className="wins-count">{player.wins}</span>
                      <span className="wins-label">wins</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-players">
            <p>No players found for this period</p>
            <p className="no-players-hint">Players will appear here once they start winning games!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage; 