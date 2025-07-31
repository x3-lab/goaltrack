import httpClient from './httpClient';
import { ENDPOINTS } from './config';
import type { 
    LoginRequest, 
    LoginResponse, 
    RegisterRequest, 
    User,
    ApiErrorResponse 
} from '../types/api';

export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
}

export interface AuthUser extends Omit<User, 'password'> {
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

class AuthApiService {
    private readonly TOKEN_KEY = 'authToken';
    private readonly REFRESH_TOKEN_KEY = 'refreshToken';
    private readonly USER_KEY = 'user';

    async login(credentials: LoginRequest): Promise<LoginResponse> {
        try {
            console.log('Attempting login for:', credentials.email);
            
            const response = await httpClient.post<LoginResponse>(
                ENDPOINTS.AUTH.LOGIN, 
                credentials
            );

            this.setAuthData(response.access_token, response.user, response.refresh_token);
            
            console.log('Login successful for:', response.user.email);
            return response;
        } catch (error: any) {
            console.error('Login failed:', error);
            this.clearAuthData();
            throw this.transformAuthError(error);
        }
    }

    async register(userData: RegisterRequest): Promise<LoginResponse> {
        try {
            console.log('Attempting registration for:', userData.email);
            
            const response = await httpClient.post<LoginResponse>(
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
        } catch (error) {
            console.warn('Logout request failed (continuing anyway):', error);
        } finally {
            this.clearAuthData();
        }
    }

    async getCurrentUser(): Promise<AuthUser> {
        try {
            const response = await httpClient.get<AuthUser>(ENDPOINTS.AUTH.PROFILE);
            
            globalThis.localStorage.setItem(this.USER_KEY, JSON.stringify(response));
            
            return response;
        } catch (error: any) {
            console.error('Failed to get current user:', error);
            
            if (error.status === 401) {
                this.clearAuthData();
            }
            
            throw this.transformAuthError(error);
        }
    }

    async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
        try {
            const response = await httpClient.patch<{ message: string }>(
                ENDPOINTS.AUTH.CHANGE_PASSWORD,
                passwordData
            );
            
            console.log('Password changed successfully');
            return response;
        } catch (error: any) {
            console.error('Password change failed:', error);
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

            const response = await httpClient.post<LoginResponse>(
                ENDPOINTS.AUTH.REFRESH,
                { refresh_token: refreshToken }
            );

            this.setAuthData(response.access_token, response.user, response.refresh_token);
            
            return {
                access_token: response.access_token,
                refresh_token: response.refresh_token
            };
        } catch (error: any) {
            console.error('Token refresh failed:', error);
            this.clearAuthData();
            throw this.transformAuthError(error);
        }
    }

    setAuthData(token: string, user: AuthUser, refreshToken?: string): void {
        globalThis.localStorage.setItem(this.TOKEN_KEY, token);
        globalThis.localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        
        if (refreshToken) {
            globalThis.localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
        
        httpClient.setAuthToken(token);
    }

    getAuthToken(): string | null {
        return globalThis.localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return globalThis.localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    getStoredUser(): AuthUser | null {
        const userStr = globalThis.localStorage.getItem(this.USER_KEY);
        if (!userStr) return null;
        
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing stored user:', error);
            return null;
        }
    }

    clearAuthData(): void {
        globalThis.localStorage.removeItem(this.TOKEN_KEY);
        globalThis.localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        globalThis.localStorage.removeItem(this.USER_KEY);
        httpClient.clearAuthToken();
    }

    isAuthenticated(): boolean {
        const token = this.getAuthToken();
        const user = this.getStoredUser();
        return !!(token && user);
    }

    isTokenExpired(): boolean {
        const token = this.getAuthToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            return payload.exp < currentTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    getUserRole(): 'admin' | 'volunteer' | null {
        const user = this.getStoredUser();
        return user?.role || null;
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

    getDebugInfo(): object {
        return {
            isAuthenticated: this.isAuthenticated(),
            hasToken: !!this.getAuthToken(),
            hasRefreshToken: !!this.getRefreshToken(),
            hasUser: !!this.getStoredUser(),
            userRole: this.getUserRole(),
            isTokenExpired: this.isTokenExpired(),
        };
    }
}

export const authApi = new AuthApiService();
export default authApi;
