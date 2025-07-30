import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';

if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  } as any;
}

if (typeof window === 'undefined') {
  global.window = {
    location: { href: '' },
  } as any;
}


declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

class HttpClient {
  private client: AxiosInstance;
  private retryQueue: Array<() => void> = [];
  private isRefreshing = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };
        
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
        
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
        console.log(`${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
          status: response.status,
          data: response.data,
        });
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        console.error(`${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        const hadToken = !!this.getAuthToken();
        if (error.response?.status === 401 && !originalRequest._retry && hadToken) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.retryQueue.push(() => resolve(this.client(originalRequest)));
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processRetryQueue();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('authToken', access_token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  private processRetryQueue(): void {
    this.retryQueue.forEach((callback) => callback());
    this.retryQueue = [];
  }

  private handleAuthFailure(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    window.location.href = '/login';
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private transformError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: 500,
    };

    if (error.response) {
      apiError.status = error.response.status;
      apiError.message = (error.response.data as any)?.message || error.message;
      apiError.details = error.response.data;
    } else if (error.request) {
      apiError.message = 'Network error - please check your connection';
      apiError.status = 0;
    } else {
      apiError.message = error.message;
    }

    return apiError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.client.get<ApiResponse<T>>(url, config));
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.client.post<ApiResponse<T>>(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.client.put<ApiResponse<T>>(url, data, config));
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.client.patch<ApiResponse<T>>(url, data, config));
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.client.delete<ApiResponse<T>>(url, config));
  }

  private async requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await requestFn();
      if (response.data.data !== undefined) {
        return response.data.data;
      } else if (response.data.success) {
        return response.data as unknown as T;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (retryCount < API_CONFIG.RETRY_ATTEMPTS && this.shouldRetry(error as AxiosError)) {
        console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
        await this.delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
        return this.requestWithRetry(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

const httpClient = new HttpClient();
export default httpClient;

export { HttpClient };