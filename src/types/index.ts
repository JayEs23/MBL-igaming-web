// User related types
export interface User {
  id: number;
  username: string;
  fullName?: string;
  wins: number;
  createdAt: string;
}

// Session related types
export interface SessionPlayer {
  id: number;
  sessionId: number;
  userId: number;
  pick: number;
  isWinner: boolean;
  joinedAt: string;
  leftBeforeStart: boolean;
  user: User;
}

export interface SessionQueue {
  id: number;
  sessionId: number;
  userId: number;
  enqueuedAt: string;
  user: User;
}

export interface Session {
  id: number;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
  startedAt: string | null;
  endsAt: string | null;
  winnerNumber: number | null;
  createdAt: string;
  updatedAt: string;
  startedById: number | null;
  startedBy: User | null;
  players: SessionPlayer[];
  queue: SessionQueue[];
  timeLeft?: number; // Calculated field
  maxPlayers?: number; // From environment variable
}

// Game Action types
export interface JoinSessionRequest {
  pick: number; // Random number between 1-9
}

export interface LeaveSessionRequest {
  sessionId: number;
}

// Session Management types
export interface StartSessionRequest {
  sessionId: number;
}

export interface SessionHistory {
  date: string;
  sessions: Session[];
  totalSessions: number;
  totalPlayers: number;
}

// API Response types - Updated to match backend standard
export interface ApiResponse<T> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

// Backend Response Wrapper types
export interface SessionResponse {
  session: Session | null;
}

export interface SessionsByDateResponse {
  sessions: SessionHistory[];
}

// Auth types
export interface AuthRequest {
  username: string;
  fullName?: string;
}

export interface LoginRequest {
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Leaderboard types
export interface LeaderboardPlayer {
  id: number;
  username: string;
  fullName?: string | null;
  wins: number;
}

export type LeaderboardPeriod = 'day' | 'week' | 'month' | '';

// Game Constants
export const GAME_CONSTANTS = {
  MAX_PLAYERS: 10,
  MIN_PICK: 1,
  MAX_PICK: 9
} as const; 