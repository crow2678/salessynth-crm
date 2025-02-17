// Part 1: Core Authentication Hook and Setup
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

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/users/me`);
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Prefetch recent clients
        queryClient.prefetchQuery(
          ['clients', 'recent'],
          () => axios.get(`${API_URL}/clients?recent=true`),
          CACHE_CONFIG.recentClients
        );
      } catch (error) {
        console.error('Token validation failed:', error);
        handleAuthError();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [queryClient]);

  const handleAuthError = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear(); // Clear all cached data
  };

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
  // Part 1: Core Authentication Hook and Setup
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

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/users/me`);
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Prefetch recent clients
        queryClient.prefetchQuery(
          ['clients', 'recent'],
          () => axios.get(`${API_URL}/clients?recent=true`),
          CACHE_CONFIG.recentClients
        );
      } catch (error) {
        console.error('Token validation failed:', error);
        handleAuthError();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [queryClient]);

  const handleAuthError = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear(); // Clear all cached data
  };

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