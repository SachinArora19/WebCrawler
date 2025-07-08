import axios from 'axios';
import type { CrawlResult, CrawlRequest, ApiResponse } from '../types';

// Configure axios with base URL and interceptors
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  register: async (username: string, password: string, email: string) => {
    const response = await api.post('/auth/register', { username, password, email });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
};

// Crawler API
export const crawlerApi = {
  // Submit a new URL for crawling
  submitUrl: async (request: CrawlRequest): Promise<ApiResponse<CrawlResult>> => {
    const response = await api.post<CrawlResult>('/urls', request);
    return {
      success: true,
      data: response.data,
    };
  },

  // Get all crawl results with pagination and filtering
  getCrawlResults: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ 
    data: CrawlResult[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number 
  }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/urls?${searchParams.toString()}`);
    return {
      success: true,
      data: response.data,
    };
  },

  // Get a specific crawl result
  getCrawlResult: async (id: string): Promise<ApiResponse<CrawlResult>> => {
    const response = await api.get<CrawlResult>(`/urls/${id}`);
    return {
      success: true,
      data: response.data,
    };
  },

  // Start crawling for a specific URL
  startCrawl: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/urls/${id}/start`);
    return {
      success: true,
      data: response.data,
    };
  },

  // Stop crawling for a specific URL
  stopCrawl: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/urls/${id}/stop`);
    return {
      success: true,
      data: response.data,
    };
  },

  // Delete a crawl result
  deleteCrawlResult: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/urls/${id}`);
    return {
      success: true,
      data: response.data,
    };
  },

  // Bulk start multiple crawls
  bulkStart: async (ids: string[]): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/urls/bulk-start', { ids });
    return {
      success: true,
      data: response.data,
    };
  },

  // Bulk stop multiple crawls
  bulkStop: async (ids: string[]): Promise<ApiResponse<{ message: string }>> => {
    await Promise.all(ids.map(id => api.post(`/urls/${id}/stop`)));
    return {
      success: true,
      data: { message: 'Crawls stopped successfully' },
    };
  },

  // Bulk delete multiple crawl results
  bulkDelete: async (ids: string[]): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/urls/bulk-delete', { ids });
    return {
      success: true,
      data: response.data,
    };
  },

  // Get crawling statistics
  getStats: async (): Promise<ApiResponse<{
    totalCrawls: number;
    completedCrawls: number;
    queuedCrawls: number;
    runningCrawls: number;
    errorCrawls: number;
  }>> => {
    const response = await api.get('/stats');
    return {
      success: true,
      data: response.data,
    };
  },

  // Rerun analysis (re-crawl URLs)
  rerunAnalysis: async (ids: string[]): Promise<ApiResponse<{ message: string }>> => {
    return crawlerApi.bulkStart(ids);
  },
};

export default api;
