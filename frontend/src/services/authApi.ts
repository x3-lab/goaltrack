import httpClient from './httpClient';
import { ENDPOINTS } from './config';
import type { LoginRequest, RegisterRequest, ChangePasswordRequest } from '../types/api';

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Computed field
  role: 'admin' | 'volunteer';
  phoneNumber?: string;
  address?: string;
  position?: string;
  skills?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

class AuthApiService {
    private readonly TOKEN_KEY = 'authToken';
    private readonly REFRESH_TOKEN_KEY = 'refreshToken';
    private readonly USER_KEY = 'user';

    async login(credentials: LoginRequest): Promise<LoginResponse> {
        try {
            console.log('🔐 Attempting login for:', credentials.email);
            
            const response = await httpClient.post<LoginResponse>(
                ENDPOINTS.AUTH.LOGIN, 
                credentials
            );

            this.setAuthData(response.access_token, response.user, response.refresh_token);
            
            console.log('✅ Login successful for:', response.user.email);
            return response;
        } catch (error: any) {
            console.error('❌ Login failed:', error);
            this.clearAuthData();
            throw this.transformAuthError(error);
        }
    }

    async register(userData: RegisterRequest): Promise<LoginResponse> {
        try {
            console.log('📝 Attempting registration for:', userData.email);
            
            const response = await httpClient.postNoRetry<LoginResponse>(
                ENDPOINTS.AUTH.REGISTER, 
                userData
            );

            this.setAuthData(response.access_token, response.user, response.refresh_token);
            
            console.log('Registration successful for:', response.user.email);
            return response;
        } catch (error: any) {
            console.error('Registration failed:', error);
            throw this.transformAuthError(error);
        }
    }

    async logout(): Promise<void> {
        try {
            console.log('Logging out user');
            // Don't retry logout requests
            await httpClient.postNoRetry(ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            console.warn('Logout request failed (continuing anyway):', error);
        } finally {
            this.clearAuthData();
            console.log('User logged out locally');
        }
    }

    async getCurrentUser(): Promise<AuthUser> {
        try {
            console.log('Getting current user profile');
            
            const response = await httpClient.get<AuthUser>(ENDPOINTS.AUTH.PROFILE);
            
            localStorage.setItem(this.USER_KEY, JSON.stringify(response));
            
            console.log('Current user profile loaded');
            return response;
        } catch (error: any) {
            console.error('Failed to get current user:', error);
            throw this.transformAuthError(error);
        }
    }

    async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
        try {
            console.log('Changing user password');
            
            const response = await httpClient.post<{ message: string }>(
                ENDPOINTS.AUTH.CHANGE_PASSWORD,
                passwordData
            );
            
            console.log('Password changed successfully');
            return response;
        } catch (error: any) {
            console.error('Failed to change password:', error);
            throw this.transformAuthError(error);
        }
    }

    async updateUser(userData: Partial<AuthUser>): Promise<AuthUser> {
        try {
            console.log('Updating user data:', userData);
            
            const response = await httpClient.put<AuthUser>(
                ENDPOINTS.AUTH.PROFILE,
                userData
            );
            
            this.setAuthData(this.getAuthToken() || '', response, this.getRefreshToken() || undefined);
            
            console.log('User data updated successfully');
            return response;
        } catch (error: any) {
            console.error('Failed to update user:', error);
            throw this.transformAuthError(error);
        }
    }

    async refreshToken(): Promise<AuthTokens> {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            console.log('Refreshing authentication token');
            
            const response = await httpClient.postNoRetry<AuthTokens>(
                ENDPOINTS.AUTH.REFRESH,
                { refresh_token: refreshToken }
            );
            
            this.setAuthData(response.access_token, this.getStoredUser(), response.refresh_token);
            
            console.log('Token refreshed successfully');
            return response;
        } catch (error: any) {
            console.error('Failed to refresh token:', error);
            this.clearAuthData();
            throw this.transformAuthError(error);
        }
    }

    // Token management methods
    setAuthData(token: string, user: AuthUser, refreshToken?: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        if (refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
    }

    getAuthToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    getStoredUser(): AuthUser | null {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    clearAuthData(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getAuthToken();
    }

    isTokenExpired(): boolean {
        const token = this.getAuthToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            return Date.now() >= exp;   
        }
        catch (error) {
            console.error('Failed to decode token:', error);
            return true; // Assume expired if we can't decode
        }
    }

    private transformAuthError(error: any): Error {
        if (error.status === 401) {
            return new Error('Invalid credentials. Please check your email and password.');
        } else if (error.status === 403) {
            return new Error('Access denied. You do not have permission to perform this action.');
        } else if (error.status === 422) {
            return new Error(error.message || 'Invalid input data. Please check your information.');
        } else if (error.status === 409) {
            return new Error('An account with this email already exists.');
        } else if (error.status >= 500) {
            return new Error('Server error. Please try again later.');
        } else if (error.status === 0) {
            return new Error('Network error. Please check your internet connection.');
        }
        
        return new Error(error.message || 'An unexpected error occurred.');
    }
}

export const authApi = new AuthApiService();
export default authApi;
