import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  status: string;
  mustChangePassword?: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User, userPermissions: string[]) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!getAccessToken();

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.user);
        setRole(res.data.role);
        setPermissions(res.data.permissions || []);
      }
    } catch (error) {
      // If unauthorized or failed, clear state silently
      setUser(null);
      setRole(null);
      setPermissions([]);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (token: string, userData: User, userPermissions: string[]) => {
    setAccessToken(token);
    setUser(userData);
    setPermissions(userPermissions);
    // Ensure `role` is populated immediately (not just after a page refresh)
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setRole(null);
      setPermissions([]);
      window.location.href = '/admin/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
