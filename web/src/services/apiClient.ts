/**
 * API Client Configuration
 * Handles all HTTP requests to the backend API with authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Import shared types (to be generated from OpenAPI later)
// import { components } from '../../../shared/types';
// type ApiSchemas = components['schemas'];

// Environment configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => authToken;

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    // Add auth token if available
    if (authToken) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${authToken}`,
      };
    }

    // Log requests in development
    if (IS_DEVELOPMENT) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log responses in development
    if (IS_DEVELOPMENT) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Log errors in development
      if (IS_DEVELOPMENT) {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status,
          data,
        });
      }

      // Handle 401 - Unauthorized (token expired/invalid)
      if (status === 401) {
        setAuthToken(null);
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }

      // Handle 403 - Forbidden
      if (status === 403) {
        console.warn('Access forbidden. Insufficient permissions.');
      }

      // Handle 404 - Not Found
      if (status === 404) {
        console.warn('Resource not found.');
      }

      // Handle 500 - Server Error
      if (status >= 500) {
        console.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API endpoint functions (matching mobile app structure)
export const authApi = {
  // Authentication endpoints
  login: (email: string, password: string) =>
    apiClient.post('/auth/login/', { email, password }),
  
  register: (userData: { email: string; password: string; first_name?: string; last_name?: string }) =>
    apiClient.post('/auth/register/', userData),
  
  logout: () =>
    apiClient.post('/auth/logout/'),
  
  refreshToken: (refresh: string) =>
    apiClient.post('/auth/token/refresh/', { refresh }),
  
  verifyToken: (token: string) =>
    apiClient.post('/auth/token/verify/', { token }),
  
  forgotPassword: (email: string) =>
    apiClient.post('/auth/password/reset/', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/password/reset/confirm/', { token, password }),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post('/auth/password/change/', { 
      old_password: oldPassword, 
      new_password: newPassword 
    }),
  
  // User profile
  getProfile: () =>
    apiClient.get('/auth/user/'),
  
  updateProfile: (profileData: any) =>
    apiClient.patch('/auth/user/', profileData),
  
  // Supabase integration
  exchangeSupabaseToken: (supabaseToken: string) =>
    apiClient.post('/auth/supabase-exchange/', { supabase_token: supabaseToken }),
};

export const motorcycleApi = {
  // Motorcycle management
  getMotorcycles: () =>
    apiClient.get('/motorcycles/'),
  
  getMotorcycle: (id: string) =>
    apiClient.get(`/motorcycles/${id}/`),
  
  createMotorcycle: (motorcycleData: any) =>
    apiClient.post('/motorcycles/', motorcycleData),
  
  updateMotorcycle: (id: string, motorcycleData: any) =>
    apiClient.patch(`/motorcycles/${id}/`, motorcycleData),
  
  deleteMotorcycle: (id: string) =>
    apiClient.delete(`/motorcycles/${id}/`),
  
  // Search and compatibility
  searchMotorcycles: (query: string) =>
    apiClient.get(`/motorcycles/search/?q=${encodeURIComponent(query)}`),
  
  checkCompatibility: (motorcycleId: string, tuneId: string) =>
    apiClient.get(`/motorcycles/${motorcycleId}/compatibility/${tuneId}/`),
};

export const tuneApi = {
  // Tune management
  getTunes: (params?: any) =>
    apiClient.get('/tunes/', { params }),
  
  getTune: (id: string) =>
    apiClient.get(`/tunes/${id}/`),
  
  createTune: (tuneData: any) =>
    apiClient.post('/tunes/', tuneData),
  
  updateTune: (id: string, tuneData: any) =>
    apiClient.patch(`/tunes/${id}/`, tuneData),
  
  deleteTune: (id: string) =>
    apiClient.delete(`/tunes/${id}/`),
  
  // Tune interactions
  likeTune: (id: string) =>
    apiClient.post(`/tunes/${id}/like/`),
  
  unlikeTune: (id: string) =>
    apiClient.delete(`/tunes/${id}/like/`),
  
  downloadTune: (id: string) =>
    apiClient.get(`/tunes/${id}/download/`),
  
  // AI and analysis
  analyzeTune: (tuneData: any) =>
    apiClient.post('/ai/analyze-tune/', tuneData),
  
  getRecommendations: (motorcycleId: string) =>
    apiClient.get(`/ai/recommendations/${motorcycleId}/`),
};

export const communityApi = {
  // Community features
  getPosts: (params?: any) =>
    apiClient.get('/community/posts/', { params }),
  
  getPost: (id: string) =>
    apiClient.get(`/community/posts/${id}/`),
  
  createPost: (postData: any) =>
    apiClient.post('/community/posts/', postData),
  
  updatePost: (id: string, postData: any) =>
    apiClient.patch(`/community/posts/${id}/`, postData),
  
  deletePost: (id: string) =>
    apiClient.delete(`/community/posts/${id}/`),
  
  // Comments
  getComments: (postId: string) =>
    apiClient.get(`/community/posts/${postId}/comments/`),
  
  createComment: (postId: string, content: string) =>
    apiClient.post(`/community/posts/${postId}/comments/`, { content }),
};

export const safetyApi = {
  // Safety validation
  validateTune: (tuneData: any) =>
    apiClient.post('/safety/validate/', tuneData),
  
  getSafetyGuidelines: () =>
    apiClient.get('/safety/guidelines/'),
  
  reportSafetyIssue: (issueData: any) =>
    apiClient.post('/safety/report/', issueData),
};

// Export default client
export default apiClient;
