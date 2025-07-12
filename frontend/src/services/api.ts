
import { QueryClient } from '@tanstack/react-query';

// API Configuration
console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 10000;

// Types for API responses
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Custom error class
export class ApiException extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// Retry configuration
const RETRY_CONFIG = {
  attempts: 3,
  delay: 1000,
  backoff: 2,
};

// Generic API request function with retry logic
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiException(
        errorData.message || 'API request failed',
        errorData.code || 'UNKNOWN_ERROR',
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle retry logic
    if (retryCount < RETRY_CONFIG.attempts - 1 && shouldRetry(error)) {
      const delay = RETRY_CONFIG.delay * Math.pow(RETRY_CONFIG.backoff, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest<T>(endpoint, options, retryCount + 1);
    }

    // Re-throw the error if retry limit reached or error shouldn't be retried
    if (error instanceof ApiException) {
      throw error;
    }

    throw new ApiException(
      error instanceof Error ? error.message : 'Network error occurred',
      'NETWORK_ERROR',
      0,
      error
    );
  }
}

// Determine if error should be retried
function shouldRetry(error: any): boolean {
  if (error instanceof ApiException) {
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  return error.name === 'AbortError' || error.message?.includes('fetch');
}

// API endpoints for different resources
export const api = {
  // Authentication
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiRequest<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      apiRequest<{}>('/auth/logout', { method: 'POST' }),
    refresh: () =>
      apiRequest<{ token: string }>('/auth/refresh', { method: 'POST' }),
  },

  // Goals
  goals: {
    getAll: (filters?: { status?: string; category?: string }) =>
      apiRequest<any[]>(`/goals${filters ? `?${new URLSearchParams(filters)}` : ''}`),
    getById: (id: string) =>
      apiRequest<any>(`/goals/${id}`),
    create: (goal: any) =>
      apiRequest<any>('/goals', {
        method: 'POST',
        body: JSON.stringify(goal),
      }),
    update: (id: string, updates: any) =>
      apiRequest<any>(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      apiRequest<{}>(`/goals/${id}`, { method: 'DELETE' }),
    updateProgress: (id: string, progress: number, notes: string) =>
      apiRequest<any>(`/goals/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ progress, notes }),
      }),
  },

  // Volunteers
  volunteers: {
    getAll: (filters?: { role?: string; status?: string }) =>
      apiRequest<any[]>(`/volunteers${filters ? `?${new URLSearchParams(filters)}` : ''}`),
    getById: (id: string) =>
      apiRequest<any>(`/volunteers/${id}`),
    getPerformance: (id: string, dateRange?: { start: string; end: string }) =>
      apiRequest<any>(`/volunteers/${id}/performance${dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : ''}`),
    updateStatus: (id: string, status: string) =>
      apiRequest<any>(`/volunteers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Analytics
  analytics: {
    getSystemOverview: (dateRange?: { start: string; end: string }) =>
      apiRequest<any>(`/analytics/system${dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : ''}`),
    getVolunteerPerformance: (filters?: any) =>
      apiRequest<any[]>(`/analytics/volunteers${filters ? `?${new URLSearchParams(filters)}` : ''}`),
    exportReport: (type: string, filters?: any) =>
      apiRequest<{ downloadUrl: string }>(`/analytics/export/${type}${filters ? `?${new URLSearchParams(filters)}` : ''}`),
  },

  // Settings
  settings: {
    get: () =>
      apiRequest<any>('/settings'),
    update: (settings: any) =>
      apiRequest<any>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
};

// Mock data for development
export const mockApi = {
  goals: [
    {
      id: '1',
      title: 'Complete React Training',
      description: 'Finish the advanced React course',
      category: 'Learning',
      priority: 'High',
      status: 'in-progress',
      progress: 65,
      dueDate: '2024-08-15',
      createdAt: '2024-07-01',
      volunteerId: '1',
    },
    {
      id: '2',
      title: 'Organize Community Event',
      description: 'Plan and execute monthly community gathering',
      category: 'Community',
      priority: 'Medium',
      status: 'pending',
      progress: 20,
      dueDate: '2024-08-30',
      createdAt: '2024-07-10',
      volunteerId: '2',
    },
  ],
  volunteers: [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'volunteer',
      status: 'active',
      joinDate: '2024-01-15',
      goalsCount: 12,
      completionRate: 85,
      lastActive: '2024-07-09',
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      role: 'volunteer',
      status: 'active',
      joinDate: '2024-02-20',
      goalsCount: 8,
      completionRate: 72,
      lastActive: '2024-07-08',
    },
  ],
};

// Development mode flag
export const isDevelopment = import.meta.env.NODE_ENV === 'development';

// Create query client with default options
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiException && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});