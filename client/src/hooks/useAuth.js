// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Initialize axios default headers with stored token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try to get user profile to validate token
        const response = await axios.get(`${API_URL}/users/me`);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Attempt login
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user: userData } = response.data;

      // Store token and set axios default header
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update state
      setUser(userData);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      // Optional: Call logout endpoint if you have one
      // await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clean up regardless of logout endpoint success
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  // Axios interceptor for 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  const updateUserProfile = async (data) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/users/me`, data);
      setUser(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkEmailAvailability = async (email) => {
    try {
      await axios.post(`${API_URL}/users/check-email`, { email });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    isAuthenticated,
    loading,
    user,
    error,
    login,
    logout,
    updateUserProfile,
    checkEmailAvailability,
    setError // Expose setError to clear errors when needed
  };
};

export const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Axios request interceptor to add auth header
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Axios response interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle different error scenarios
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          // You might want to redirect to login page here
          break;
        case 403:
          // Handle forbidden access
          console.error('Access forbidden');
          break;
        case 429:
          // Handle rate limiting
          console.error('Too many requests');
          break;
        default:
          // Handle other errors
          console.error('API Error:', error.response.data);
      }
    } else if (error.request) {
      // Handle network errors
      console.error('Network Error:', error.request);
    } else {
      // Handle other errors
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);