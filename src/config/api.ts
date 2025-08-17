// API Configuration
export const API_CONFIG = {
  // Backend API base URL - production URL with localhost fallback for development
  BASE_URL: import.meta.env.VITE_API_URL || 'https://mbl-igaming.onrender.com',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login'
    },
    SESSIONS: {
      CURRENT: '/sessions/current',
      START: '/sessions/start',
      JOIN: '/sessions/join',
      LEAVE: '/sessions/leave',
      GROUP_BY_DATE: '/sessions/group-by-date',
      CREATE: '/sessions/create',
      ACTIVE: '/sessions/active',
      ENDED: '/sessions/ended',
      ENDED_BY_ID: '/sessions/ended/:id',
      RESULTS_BY_ID: '/sessions/results/:id'
    },
    LEADERBOARD: {
      TOP: '/leaderboard',
      BY_PERIOD: '/leaderboard/by-period'
    },
    GAME: {
      PICK_NUMBER: '/game/pick',
      SESSION_STATUS: '/game/session-status',
      PLAYER_QUEUE: '/game/player-queue'
    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to get query parameters
export const buildQueryParams = (params: Record<string, string | number | boolean>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}; 