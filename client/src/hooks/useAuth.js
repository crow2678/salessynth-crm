import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';  // Add this import

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Helper to get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  // Add this effect to initialize axios headers
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Validate token and fetch user data
  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Check authentication status on mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user: userData } = await response.json();
      localStorage.setItem('token', token);
      // Add this line to set axios header after login
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    // Add this line to remove axios header on logout
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  // Setup global fetch interceptor for handling 401s
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (response.status === 401) {
          logout();
          window.location.replace('/login');
          return Promise.reject(new Error('Session expired'));
        }
        
        return response;
      } catch (error) {
        return Promise.reject(error);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  return {
    isAuthenticated,
    loading,
    user,
    error,
    login,
    logout,
    getAuthHeaders
  };
};

// Helper for creating auth headers
export const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};