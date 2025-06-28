import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser, LoginInput, RegisterInput, OAuthInput } from '../../../server/src/schema';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithOAuth: (input: OAuthInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Since tRPC utils are protected, we'll create our own fetch functions
async function fetchFromAPI(endpoint: string, data?: Record<string, unknown>, method = 'POST') {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api/${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }

  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const currentUser = await fetchFromAPI('auth.getCurrentUser', undefined, 'GET');
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to get current user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (input: LoginInput) => {
    try {
      const result = await fetchFromAPI('auth.login', input);
      localStorage.setItem('auth_token', result.user.id);
      setUser(result.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      const result = await fetchFromAPI('auth.register', input);
      localStorage.setItem('auth_token', result.user.id);
      setUser(result.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const loginWithOAuth = async (input: OAuthInput) => {
    try {
      const result = await fetchFromAPI('auth.oauth', input);
      localStorage.setItem('auth_token', result.user.id);
      setUser(result.user);
    } catch (error) {
      console.error('OAuth login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      loginWithOAuth,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}