import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '../store';
import type { AuthUser, UserProfile } from '../types';

interface UserContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

/**
 * UserProvider - Provides read-only user and profile data from auth store
 * 
 * This context provides a clean separation between auth logic (auth store)
 * and display data (UserContext). Components should use useUser() for
 * reading user/profile data, and useAuth() for auth actions (login, logout).
 */
export function UserProvider({ children }: UserProviderProps) {
  const { user, profile } = useAuthStore();
  const [value, setValue] = useState<UserContextValue>({ user, profile });

  // Subscribe to auth store changes
  useEffect(() => {
    setValue({ user, profile });
  }, [user, profile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * useUser - Hook to access user and profile data
 * 
 * @returns {UserContextValue} Object with user and profile
 * @throws {Error} If used outside UserProvider
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
