import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = authService.getCurrentUser();
      const savedToken = localStorage.getItem('token');
      
      if (savedToken) {
        setToken(savedToken);
        // Always try to fetch latest user info if token exists
        const latestUser = await authService.getMe();
        if (latestUser) {
          setUser(latestUser);
        } else if (savedUser) {
          // Fallback to saved user if request fails but token exists
          setUser(savedUser);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return null;
    const latestUser = await authService.getMe();
    if (latestUser) {
      setUser(latestUser);
      return latestUser;
    }
    return null;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user: loggedInUser, token: authToken } = await authService.login(email, password);
      setUser(loggedInUser);
      setToken(authToken);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      return await authService.register(userData);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = (updates) => {
    const updated = authService.updateCurrentUser(updates);
    if (updated) {
      setUser(updated);
    }
    return updated;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    updateUserProfile,
    refreshUser,
    isAuthenticated: !!user,
    role: user?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
