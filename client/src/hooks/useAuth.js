// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

// Cache configuration
const CACHE_CONFIG = {
  recentClients: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30 // 30 minutes
  },
  paginatedClients: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 15 // 15 minutes
  }
};

// Helper function for auth headers - moved to top level
export const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Main auth hook
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // Initialize axios default headers with stored token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleAuthError = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear(); // Clear all cached data
  };

  // Check authentication status on mount
  useEffect(() => {
    // In useAuth.js, modify the checkAuth function
		const checkAuth = async () => {
		  const token = localStorage.getItem('token');
		  if (!token) {
			setLoading(false);
			return;
		  }

		  // Instead of fetching /me endpoint, validate token and proceed
		  try {
			const decoded = jwt.decode(token);
			if (decoded && decoded.userId) {
			  setUser({ id: decoded.userId });
			  setIsAuthenticated(true);
			  
			  // Prefetch recent clients
			  queryClient.prefetchQuery(
				['clients', 'recent'],
				() => axios.get(`${API_URL}/clients?recent=true`),
				CACHE_CONFIG.recentClients
			  );
			} else {
			  handleAuthError();
			}
		  } catch (error) {
			console.error('Token validation failed:', error);
			handleAuthError();
		  } finally {
			setLoading(false);
		  }
		};

    checkAuth();
  }, [queryClient]);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setIsAuthenticated(true);

      // Prefetch initial data
      await queryClient.prefetchQuery(
        ['clients', 'recent'],
        () => axios.get(`${API_URL}/clients?recent=true`),
        CACHE_CONFIG.recentClients
      );

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
      await queryClient.cancelQueries();
      queryClient.clear();
      handleAuthError();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

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
    setError
  };
};

// Axios request interceptor
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Axios response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default useAuth;