import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '@ui';

interface AuthContextType {
  isLoggedIn: boolean;
  user: Record<string, any> | null;
  login: (user: Record<string, any>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuthStore();
  const user = auth.user;

  const login = (userData: Record<string, any>) => auth.setUser(userData);
  const logout = () => auth.logout();

  return (
    <AuthContext.Provider value={{ isLoggedIn: auth.isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
