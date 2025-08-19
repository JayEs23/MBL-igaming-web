import { buildApiUrl, getAuthHeaders, buildQueryParams, API_CONFIG } from '../config/api';
import type { 
  Session, 
  JoinSessionRequest, 
  LeaveSessionRequest,
  ApiResponse,
  SessionHistory,
  LeaderboardPlayer,
  SessionResponse,
  SessionsByDateResponse
} from '../types';

export class GameService {
  // Get current active session
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const fullUrl = buildApiUrl(API_CONFIG.ENDPOINTS.SESSIONS.CURRENT);
      
      const response = await fetch(fullUrl, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ApiResponse<SessionResponse> = await response.json();
      
      return data.status === 'success' ? data.data.session : null;
    } catch (error) {
      console.error('Error fetching current session:', error);
      return null;
    }
  }

  // Get ended session results by session ID
  static async getEndedSessionResults(sessionId: number): Promise<Session | null> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const endpoint = API_CONFIG.ENDPOINTS.SESSIONS.ENDED_BY_ID.replace(':id', sessionId.toString());
        const fullUrl = buildApiUrl(endpoint);
        
        const response = await fetch(fullUrl, {
          headers: getAuthHeaders()
        });
        
        if (response.status === 404) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            return await this.getSessionResultsFallback(sessionId);
          }
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: ApiResponse<Session> = await response.json();
        
        if (data.status === 'success') {
          return data.data;
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error fetching ended session results (attempt ${attempt}):`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          return await this.getSessionResultsFallback(sessionId);
        }
      }
    }
    
    return null;
  }

  // Fallback method to get session results regardless of status
  static async getSessionResultsFallback(sessionId: number): Promise<Session | null> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.SESSIONS.RESULTS_BY_ID.replace(':id', sessionId.toString());
      const fullUrl = buildApiUrl(endpoint);
      
      const response = await fetch(fullUrl, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data: ApiResponse<Session> = await response.json();
      
      if (data.status === 'success') {
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error with fallback endpoint:', error);
      return null;
    }
  }

  // Join an active session with a number pick
  static async joinSession(pick: number): Promise<{ success: boolean; message: string; session?: Session }> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SESSIONS.JOIN), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pick } as JoinSessionRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<{ session: Session }> = await response.json();
      
      if (data.status === 'success') {
        return { 
          success: true, 
          message: data.message,
          session: data.data.session
        };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error joining session:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Leave a session before it starts
  static async leaveSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SESSIONS.LEAVE), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId } as LeaveSessionRequest)
      });

      const data: ApiResponse<{ message: string }> = await response.json();
      
      if (data.status === 'success') {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error leaving session:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Start a session (for session initiators)
  static async startSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SESSIONS.START), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId })
      });

      const data: ApiResponse<{ message: string }> = await response.json();
      
      if (data.status === 'success') {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Get sessions grouped by date
  static async getSessionsByDate(period: 'day' | 'week' | 'month' = 'day'): Promise<SessionHistory[]> {
    try {
      const queryParams = buildQueryParams({ period });
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.SESSIONS.GROUP_BY_DATE) + queryParams,
        { headers: getAuthHeaders() }
      );

      const data: ApiResponse<SessionsByDateResponse> = await response.json();
      return data.status === 'success' ? data.data.sessions : [];
    } catch (error) {
      console.error('Error fetching sessions by date:', error);
      return [];
    }
  }

  // Get leaderboard
  static async getLeaderboard(period: 'day' | 'week' | 'month' | '' = ''): Promise<LeaderboardPlayer[]> {
    try {
      const queryParams = period ? buildQueryParams({ period }) : '';
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.LEADERBOARD.TOP) + queryParams,
        { headers: getAuthHeaders() }
      );

      const data: ApiResponse<LeaderboardPlayer[]> = await response.json();
      
      if (data.status === 'success') {
        // Backend returns the array directly in data, not wrapped in players property
        return data.data || [];
      } else {
        console.error('Leaderboard API error:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Check if user can join (not already in active session)
  static async canUserJoin(): Promise<{ canJoin: boolean; message: string }> {
    try {
      const currentSession = await this.getCurrentSession();
      
      if (!currentSession) {
        return { canJoin: false, message: 'No active session available' };
      }

      if (currentSession.status !== 'ACTIVE') {
        return { canJoin: false, message: 'Session is not active yet' };
      }

      // Check if user is already in the session
      const token = localStorage.getItem('token');
      if (token) {
        // This would need a proper user ID check from the backend
        // For now, we'll assume they can join if not already in
        return { canJoin: true, message: 'Can join session' };
      }

      return { canJoin: false, message: 'User not authenticated' };
    } catch (error) {
      console.error('Error checking if user can join:', error);
      return { canJoin: false, message: 'Error checking session status' };
    }
  }

  static async checkSessionJoinability() {
    try {
      const fullUrl = buildApiUrl(API_CONFIG.ENDPOINTS.SESSIONS.JOINABLE);
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking session joinability:', error);
      throw error;
    }
  }

  // Get session countdown timer
  static getSessionCountdown(session: Session): number {
    if (!session.endsAt) return 0;
    
    const now = new Date().getTime();
    const endTime = new Date(session.endsAt).getTime();
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
    
    return timeLeft;
  }

  // Validate number pick (1-9)
  static validatePick(pick: number): boolean {
    return Number.isInteger(pick) && pick >= 1 && pick <= 9;
  }
} 