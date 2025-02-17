import { useState, useEffect, useCallback } from 'react';

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

  // Check authentication status on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
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
        handleUnauthorized();
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [getAuthHeaders]);

  const handleUnauthorized = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);

    // Get current path
    const currentPath = window.location.pathname;
    
    // Only redirect to login if not already on login page
    if (currentPath !== '/login') {
      // Store the return path if not on login page
      if (currentPath !== '/') {
        localStorage.setItem('returnTo', currentPath);
      }
      window.location.replace('/login');
    }
  };

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
      setUser(userData);
      setIsAuthenticated(true);

      // Check for and handle return path
      const returnTo = localStorage.getItem('returnTo');
      if (returnTo) {
        localStorage.removeItem('returnTo');
        window.location.replace(returnTo);
      } else {
        window.location.replace('/');
      }

      return true;
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Global fetch interceptor for handling 401s
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (response.status === 401) {
          handleUnauthorized();
          return Promise.reject(new Error('Session expired'));
        }
        
        return response;
      } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          console.error('Network error:', error);
          // Handle network errors without redirect
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

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