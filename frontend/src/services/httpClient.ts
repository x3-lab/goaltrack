import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from './config';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class HttpClient {
  private client: AxiosInstance;
  private retryQueue: Array<() => void> = [];
  private isRefreshing = false;

  // private hasNotifiedAuthFailure = false;

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
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });

        // If no response (network), just pass along
        if (!error.response) {
          return Promise.reject(this.transformError(error));
        }

        const status = error.response.status;

        // 401 handling
        if (status === 401) {
          const hasAccess = !!this.getAuthToken();
            const hasRefresh = !!this.getRefreshToken();

          // If we have both tokens, try refresh once
          if (hasAccess && hasRefresh && !originalRequest._retry) {
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.retryQueue.push(() => {
                  originalRequest.headers = originalRequest.headers || {};
                  originalRequest.headers.Authorization = `Bearer ${this.getAuthToken()}`;
                  this.client(originalRequest).then(resolve).catch(reject);
                });
              });
            }

            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
              await this.refreshTokenSilently();
              this.processRetryQueue();
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${this.getAuthToken()}`;
              return this.client(originalRequest);
            } catch (refreshErr) {
              this.flushRetryQueueWithFailure(refreshErr);
              // Fall through to reject – let context handle logout / redirect
            } finally {
              this.isRefreshing = false;
            }
          }

          // No tokens to refresh or refresh failed: just reject (NO redirect here)
          // Upstream (AuthContext) decides what to do.
          return Promise.reject(this.transformError(error));
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private async refreshTokenSilently(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token: newRefreshToken, user } = response.data;
    localStorage.setItem('authToken', access_token);
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }

  private flushRetryQueueWithFailure(err: any) {
    this.retryQueue.forEach(cb => cb());
    this.retryQueue = [];
  }

  private processRetryQueue(): void {
    this.retryQueue.forEach(cb => cb());
    this.retryQueue = [];
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private shouldRetry(error: AxiosError, retryCount: number): boolean {
    if (retryCount >= API_CONFIG.RETRY_ATTEMPTS) {
      return false;
    }

    if (!error.response) {
      return true;
    }

    const status = error.response.status;

    if (status >= 400 && status < 500) {
      if ([400, 401, 403, 404, 409, 422, 429].includes(status)) {
        console.log(`❌ Not retrying ${status} error - client error`);
        return false;
      }
    }

    if (status >= 500 || status === 0) {
      console.log(`🔄 Will retry ${status} error - server/network error`);
      return true;
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log(`🔄 Will retry timeout error`);
      return true;
    }

    console.log(`❌ Not retrying ${status} error - not retriable`);
    return false;
  }

  private transformError(error: AxiosError): ApiError {
    const apiError: ApiError = new Error();
    
    if (error.response) {
      apiError.status = error.response.status;
      apiError.message = (error.response.data as any)?.message || error.message;
    } else if (error.request) {
      apiError.status = 0;
      apiError.message = 'Network error. Please check your connection.';
    } else {
      apiError.message = error.message;
    }
    
    apiError.code = error.code;
    return apiError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<any>>,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await requestFn();
      
      console.log(`✅ Request successful on attempt ${retryCount + 1}`);
      
      if (response.data?.data !== undefined) {
        return response.data.data;
      } else if (response.data?.success !== false) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Request failed');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (this.shouldRetry(axiosError, retryCount)) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
        console.log(`📝 Error details:`, {
          status: axiosError.response?.status,
          message: axiosError.message,
          code: axiosError.code
        });
        
        await this.delay(delay);
        return this.requestWithRetry(requestFn, retryCount + 1);
      }
      
      console.log(`❌ Request failed permanently after ${retryCount + 1} attempts`);
      throw this.transformError(axiosError);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() => this.client.get(url, config));
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() => this.client.post(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() => this.client.put(url, data, config));
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() => this.client.patch(url, data, config));
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() => this.client.delete(url, config));
  }

  async postNoRetry<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post(url, data, config);
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      throw this.transformError(error as AxiosError);
    }
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
}

export const httpClient = new HttpClient();
export default httpClient;