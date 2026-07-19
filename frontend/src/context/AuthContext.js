import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/apiService';
import socketService from '../services/socketService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Connect / disconnect socket whenever auth state changes
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
      }
    } else {
      socketService.disconnect();
    }
  }, [user]);

  const login = async (credentials) => {
    const userData = await authService.login(credentials);
    setUser(userData);
    return userData;
  };

  // NOTE: registration no longer logs the user in — the backend now requires
  // OTP verification first. This call only creates the account and sends the OTP;
  // it intentionally does NOT call setUser(). See verifyOtp() below for that.
  const register = async (userData) => {
    const response = await authService.register(userData);
    return response;
  };

  const verifyOtp = async ({ email, otp }) => {
    const userData = await authService.verifyOtp({ email, otp });
    setUser(userData);
    return userData;
  };

  const resendOtp = async (email) => {
    return await authService.resendOtp(email);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};