import { createContext, useContext } from 'react';
import type { Session } from '../types';

interface SessionContextType {
  currentSession: Session | null;
  updateSession: (session: Session | null) => void;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 