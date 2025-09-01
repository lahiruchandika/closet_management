import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://192.168.15.11:3000';
const TOKEN_KEY = '@outfitly_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added token to request:', config.url);
      } else {
        console.log('No token found for request:', config.url);
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear stored token if unauthorized
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem('@outfitly_user');
      
      // Redirect to login or show alert
      console.log('Token expired or invalid, user needs to login again');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string, confirmPassword: string) => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getProfile: async (token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.get('/auth/profile', config);
    return response.data;
  },

  updateProfile: async (data: any, token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.put('/auth/profile', data, config);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Items API - All endpoints require authentication
export const itemsAPI = {
  // Get all items for the authenticated user
  getItems: async () => {
    console.log('Fetching items...');
    const response = await apiClient.get('/items');
    console.log('Items response:', response.data);
    return response.data;
  },

  // Get single item by ID (only if it belongs to authenticated user)
  getItem: async (id: string) => {
    console.log('Fetching item:', id);
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },

  // Create new item
  createItem: async (formData: FormData) => {
    console.log('Creating item...');
    const response = await apiClient.post('/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Create item response:', response.data);
    return response.data;
  },

  // Update existing item
  updateItem: async (id: string, formData: FormData) => {
    console.log('Updating item:', id);
    const response = await apiClient.put(`/items/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete item
  deleteItem: async (id: string) => {
    console.log('Deleting item:', id);
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  },

  // Get item statistics
  getItemStats: async () => {
    const response = await apiClient.get('/items/stats');
    return response.data;
  },
};

// Outfit API - All endpoints require authentication
export const outfitsAPI = {
  // Get all outfits for the authenticated user
  getOutfits: async () => {
    console.log('Fetching outfits...');
    const response = await apiClient.get('/outfits');
    console.log('Outfits response:', response.data);
    return response.data;
  },

  // Get single outfit by ID (only if it belongs to authenticated user)
  getOutfit: async (id: string) => {
    console.log('Fetching outfit:', id);
    const response = await apiClient.get(`/outfits/${id}`);
    return response.data;
  },

  // Create new outfit
  createOutfit: async (outfitData: {
    name: string;
    occasion: string;
    plannedDate?: string;
    items: Array<{
      item: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      rotation?: number;
      zIndex?: number;
    }>;
  }) => {
    console.log('Creating outfit...');
    const response = await apiClient.post('/outfits', outfitData);
    console.log('Create outfit response:', response.data);
    return response.data;
  },

  // Delete outfit
  deleteOutfit: async (id: string) => {
    console.log('Deleting outfit:', id);
    const response = await apiClient.delete(`/outfits/${id}`);
    return response.data;
  },

  // Get outfit statistics
  getOutfitStats: async () => {
    const response = await apiClient.get('/outfits/stats');
    return response.data;
  },
};

// General API utilities
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Get stored token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },

  // Clear authentication
  clearAuth: async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, '@outfitly_user']);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  },

  // Handle authentication errors
  handleAuthError: (error: any) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - this is handled by the interceptor
      return true;
    }
    return false;
  },
};

export default apiClient;