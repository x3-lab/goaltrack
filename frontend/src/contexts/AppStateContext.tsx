
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for global state
interface AppState {
  user: any | null;
  goals: any[];
  volunteers: any[];
  analytics: any;
  settings: any;
  ui: {
    loading: Record<string, boolean>;
    errors: Record<string, string>;
    isOnline: boolean;
    lastSync: string | null;
  };
}

// Action types
type AppAction = 
  | { type: 'SET_USER'; payload: any | null }
  | { type: 'SET_GOALS'; payload: any[] }
  | { type: 'ADD_GOAL'; payload: any }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: any } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_VOLUNTEERS'; payload: any[] }
  | { type: 'UPDATE_VOLUNTEER'; payload: { id: string; updates: any } }
  | { type: 'SET_ANALYTICS'; payload: any }
  | { type: 'SET_SETTINGS'; payload: any }
  | { type: 'SET_LOADING'; payload: { key: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  user: null,
  goals: [],
  volunteers: [],
  analytics: {},
  settings: {},
  ui: {
    loading: {},
    errors: {},
    isOnline: navigator.onLine,
    lastSync: null,
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id
            ? { ...goal, ...action.payload.updates }
            : goal
        ),
      };
    
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload),
      };
    
    case 'SET_VOLUNTEERS':
      return { ...state, volunteers: action.payload };
    
    case 'UPDATE_VOLUNTEER':
      return {
        ...state,
        volunteers: state.volunteers.map(volunteer =>
          volunteer.id === action.payload.id
            ? { ...volunteer, ...action.payload.updates }
            : volunteer
        ),
      };
    
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: {
            ...state.ui.loading,
            [action.payload.key]: action.payload.loading,
          },
        },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: {
            ...state.ui.errors,
            [action.payload.key]: action.payload.error,
          },
        },
      };
    
    case 'CLEAR_ERROR':
      const newErrors = { ...state.ui.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        ui: { ...state.ui, errors: newErrors },
      };
    
    case 'SET_ONLINE':
      return {
        ...state,
        ui: { ...state.ui, isOnline: action.payload },
      };
    
    case 'SET_LAST_SYNC':
      return {
        ...state,
        ui: { ...state.ui, lastSync: action.payload },
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context
interface AppStateContextType {
  state: AppState;
  actions: {
    setUser: (user: any | null) => void;
    setGoals: (goals: any[]) => void;
    addGoal: (goal: any) => void;
    updateGoal: (id: string, updates: any) => void;
    deleteGoal: (id: string) => void;
    setVolunteers: (volunteers: any[]) => void;
    updateVolunteer: (id: string, updates: any) => void;
    setAnalytics: (analytics: any) => void;
    setSettings: (settings: any) => void;
    setLoading: (key: string, loading: boolean) => void;
    setError: (key: string, error: string) => void;
    clearError: (key: string) => void;
    // setOnline: (online: boolean) => void;
    setLastSync: (timestamp: string) => void;
    resetState: () => void;
  };
  selectors: {
    isLoading: (key: string) => boolean;
    getError: (key: string) => string | undefined;
    getUserGoals: () => any[];
    getGoalsByStatus: (status: string) => any[];
    getActiveVolunteers: () => any[];
  };
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider component
export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();

  // Action creators
  const actions = {
    setUser: useCallback((user: any | null) => {
      dispatch({ type: 'SET_USER', payload: user });
    }, []),

    setGoals: useCallback((goals: any[]) => {
      dispatch({ type: 'SET_GOALS', payload: goals });
    }, []),

    addGoal: useCallback((goal: any) => {
      dispatch({ type: 'ADD_GOAL', payload: goal });
      toast({
        title: "Goal Created",
        description: `"${goal.title}" has been added to your goals.`,
      });
    }, [toast]),

    updateGoal: useCallback((id: string, updates: any) => {
      dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } });
      toast({
        title: "Goal Updated",
        description: "Your goal has been updated successfully.",
      });
    }, [toast]),

    deleteGoal: useCallback((id: string) => {
      dispatch({ type: 'DELETE_GOAL', payload: id });
      toast({
        title: "Goal Deleted",
        description: "The goal has been removed from your list.",
      });
    }, [toast]),

    setVolunteers: useCallback((volunteers: any[]) => {
      dispatch({ type: 'SET_VOLUNTEERS', payload: volunteers });
    }, []),

    updateVolunteer: useCallback((id: string, updates: any) => {
      dispatch({ type: 'UPDATE_VOLUNTEER', payload: { id, updates } });
    }, []),

    setAnalytics: useCallback((analytics: any) => {
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    }, []),

    setSettings: useCallback((settings: any) => {
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    }, []),

    setLoading: useCallback((key: string, loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: { key, loading } });
    }, []),

    setError: useCallback((key: string, error: string) => {
      dispatch({ type: 'SET_ERROR', payload: { key, error } });
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }, [toast]),

    clearError: useCallback((key: string) => {
      dispatch({ type: 'CLEAR_ERROR', payload: key });
    }, []),

    setLastSync: useCallback((timestamp: string) => {
      dispatch({ type: 'SET_LAST_SYNC', payload: timestamp });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, []),
  };

  // Selectors
  const selectors = {
    isLoading: useCallback((key: string) => !!state.ui.loading[key], [state.ui.loading]),
    getError: useCallback((key: string) => state.ui.errors[key], [state.ui.errors]),
    getUserGoals: useCallback(() => {
      return state.user?.role === 'admin' 
        ? state.goals 
        : state.goals.filter(goal => goal.volunteerId === state.user?.id);
    }, [state.goals, state.user]),
    getGoalsByStatus: useCallback((status: string) => {
      return state.goals.filter(goal => goal.status === status);
    }, [state.goals]),
    getActiveVolunteers: useCallback(() => {
      return state.volunteers.filter(volunteer => volunteer.status === 'active');
    }, [state.volunteers]),
  };

  const value = {
    state,
    actions,
    selectors,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook to use app state
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};