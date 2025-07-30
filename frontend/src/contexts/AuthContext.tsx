import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authApi, type AuthUser } from '../services/authApi';
import type { LoginRequest, RegisterRequest } from '../types/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

type AuthAction =
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_INIT_FAILURE' }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: AuthUser }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: AuthUser }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
  
  hasRole: (role: 'admin' | 'volunteer') => boolean;
  refreshUserData: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case 'AUTH_INIT_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      };
      
    case 'AUTH_INIT_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
      };
      
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
      
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    dispatch({ type: 'AUTH_INIT_START' });

    try {
      if (!authApi.isAuthenticated()) {
        dispatch({ type: 'AUTH_INIT_FAILURE' });
        return;
      }

      if (authApi.isTokenExpired()) {
        console.log('Token expired, attempting refresh...');
        
        try {
          await authApi.refreshToken();
        } catch (refreshError) {
          console.log('Token refresh failed, clearing auth data');
          authApi.clearAuthData();
          dispatch({ type: 'AUTH_INIT_FAILURE' });
          return;
        }
      }

      const user = await authApi.getCurrentUser();
      dispatch({ type: 'AUTH_INIT_SUCCESS', payload: user });
      
      console.log('Authentication initialized successfully');
    } catch (error: any) {
      console.error('Auth initialization failed:', error);
      authApi.clearAuthData();
      dispatch({ type: 'AUTH_INIT_FAILURE' });
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authApi.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
      
      console.log('User logged in successfully:', response.user.email);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    dispatch({ type: 'REGISTER_START' });

    try {
      const response = await authApi.register(userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response.user });
      
      console.log('User registered successfully:', response.user.email);
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
      dispatch({ type: 'LOGOUT' });
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = async (userData: Partial<AuthUser>): Promise<void> => {
    if (!state.user) throw new Error('No user to update');

    try {
      const updatedUser = { ...state.user, ...userData };
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      
      authApi.setAuthData(
        authApi.getAuthToken() || '',
        updatedUser,
        authApi.getRefreshToken() || undefined
      );
      
      console.log('User data updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      const user = await authApi.getCurrentUser();
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasRole = (role: 'admin' | 'volunteer'): boolean => {
    return state.user?.role === role;
  };

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
    
    login,
    register,
    logout,
    updateUser,
    clearError,
    
    hasRole,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
