import { QueryClient } from '@tanstack/react-query';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Custom error class for API exceptions
export class ApiException extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiException';
  }
}

// Development mode flag
export const isDevelopment = import.meta.env.NODE_ENV === 'development';

// Volunteer and Goal interfaces - EXPORTED
export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  role: string;
  skills?: string;
  joinDate: string;
  goalsCount: number;
  completionRate: number;
  lastActive: string;
  performance: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  volunteer: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  dueDate: string;
  createdDate: string;
  createdAt: string; // Keep both for backward compatibility
  updatedAt: string;
  tags?: string[];
  notes?: string;
  volunteerId?: string; // For backward compatibility
}

// Add AdminProfile interface and export it
export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin';
  joinDate: string;
  lastLogin: string;
  profileImage?: string;
  department: string;
  title: string;
  permissions: string[];
  preferences: {
    emailNotifications: boolean;
    weeklyReports: boolean;
    systemAlerts: boolean;
    theme: 'light' | 'dark' | 'auto';
    timezone: string;
  };
  stats: {
    totalVolunteersManaged: number;
    totalGoalsOversaw: number;
    lastSystemMaintenance: string;
  };
}

// Type for creating a new volunteer (excludes auto-generated fields)
export type CreateVolunteerData = Omit<Volunteer, 'id' | 'goalsCount' | 'completionRate' | 'performance' | 'lastActive'>;

// Mock data
export const mockApi = {
  goals: [
    {
      id: '1',
      title: 'Complete React Training',
      description: 'Finish the advanced React course',
      category: 'Learning',
      priority: 'High' as const,
      status: 'in-progress' as const,
      progress: 65,
      dueDate: '2024-08-15',
      createdAt: '2024-07-01',
      createdDate: '2024-07-01',
      updatedAt: '2024-07-05',
      volunteerId: '1',
      volunteer: '1',
      tags: ['react', 'training', 'development'],
      notes: 'Making good progress on the course'
    },
    {
      id: '2',
      title: 'Organize Community Event',
      description: 'Plan and execute monthly community gathering',
      category: 'Community',
      priority: 'Medium' as const,
      status: 'pending' as const,
      progress: 20,
      dueDate: '2024-08-30',
      createdAt: '2024-07-10',
      createdDate: '2024-07-10',
      updatedAt: '2024-07-10',
      volunteerId: '2',
      volunteer: '2',
      tags: ['community', 'event', 'planning'],
      notes: 'Initial planning phase'
    },
    {
      id: '3',
      title: 'Complete Safety Training',
      description: 'Mandatory safety training for all volunteers',
      category: 'Training',
      priority: 'High' as const,
      status: 'completed' as const,
      progress: 100,
      dueDate: '2024-07-25',
      createdAt: '2024-06-15',
      createdDate: '2024-06-15',
      updatedAt: '2024-07-24',
      volunteerId: '1',
      volunteer: '1',
      tags: ['safety', 'training', 'mandatory'],
      notes: 'Completed successfully'
    },
    {
      id: '4',
      title: 'Fundraising Campaign',
      description: 'Organize monthly fundraising activities',
      category: 'Fundraising',
      priority: 'Medium' as const,
      status: 'in-progress' as const,
      progress: 45,
      dueDate: '2024-08-20',
      createdAt: '2024-07-05',
      createdDate: '2024-07-05',
      updatedAt: '2024-07-15',
      volunteerId: '3',
      volunteer: '3',
      tags: ['fundraising', 'campaign', 'activities'],
      notes: 'Halfway through the campaign'
    }
  ],
  volunteers: [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, State',
      role: 'volunteer',
      status: 'active' as const,
      skills: 'Event planning, Communication',
      joinDate: '2024-01-15',
      goalsCount: 12,
      completionRate: 85,
      lastActive: '2024-07-09',
      performance: 'high' as const,
      notes: 'Excellent volunteer with great leadership skills'
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      phone: '+1234567891',
      address: '456 Oak Ave, City, State',
      role: 'volunteer',
      status: 'active' as const,
      skills: 'Technical support, Training',
      joinDate: '2024-02-20',
      goalsCount: 8,
      completionRate: 72,
      lastActive: '2024-07-08',
      performance: 'medium' as const,
      notes: 'Reliable volunteer with technical expertise'
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma@example.com',
      phone: '+1234567892',
      address: '789 Pine St, City, State',
      role: 'volunteer',
      status: 'active' as const,
      skills: 'Fundraising, Marketing',
      joinDate: '2024-03-10',
      goalsCount: 6,
      completionRate: 90,
      lastActive: '2024-07-07',
      performance: 'high' as const,
      notes: 'Creative volunteer with strong marketing background'
    },
  ],
  adminProfile: {
    id: 'admin-1',
    name: 'John Administrator',
    email: 'admin@x3lab.com',
    phone: '+1234567890',
    role: 'admin' as const,
    joinDate: '2023-01-15',
    lastLogin: new Date().toISOString(),
    profileImage: '',
    department: 'Operations',
    title: 'System Administrator',
    permissions: [
      'manage_volunteers',
      'manage_goals',
      'view_analytics',
      'system_settings',
      'export_data',
      'send_notifications'
    ],
    preferences: {
      emailNotifications: true,
      weeklyReports: true,
      systemAlerts: true,
      theme: 'light' as const,
      timezone: 'America/New_York'
    },
    stats: {
      totalVolunteersManaged: 0,
      totalGoalsOversaw: 0,
      lastSystemMaintenance: '2024-07-01'
    }
  }
};

// Mock API implementation that uses localStorage + fallback data
export const mockLocalStorageApi = {
  volunteers: {
    getAll: async (filters?: { role?: string; status?: string }): Promise<Volunteer[]> => {
      // Try to get from localStorage first
      const stored = localStorage.getItem('volunteers');
      let volunteers = stored ? JSON.parse(stored) : mockApi.volunteers;
      
      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          volunteers = volunteers.filter((v: Volunteer) => v.status === filters.status);
        }
        if (filters.role) {
          volunteers = volunteers.filter((v: Volunteer) => v.role === filters.role);
        }
      }
      
      return volunteers;
    },
    
    getById: async (id: string): Promise<Volunteer | null> => {
      const volunteers = await mockLocalStorageApi.volunteers.getAll();
      return volunteers.find(v => v.id === id) || null;
    },
    
    create: async (volunteerData: CreateVolunteerData): Promise<Volunteer> => {
      const volunteers = await mockLocalStorageApi.volunteers.getAll();
      const newVolunteer: Volunteer = {
        ...volunteerData,
        id: Date.now().toString(),
        goalsCount: 0,
        completionRate: 0,
        performance: 'medium',
        lastActive: new Date().toISOString(),
      };
      volunteers.push(newVolunteer);
      localStorage.setItem('volunteers', JSON.stringify(volunteers));
      return newVolunteer;
    },
    
    update: async (id: string, updates: Partial<Volunteer>): Promise<Volunteer> => {
      const volunteers = await mockLocalStorageApi.volunteers.getAll();
      const index = volunteers.findIndex(v => v.id === id);
      if (index === -1) throw new Error('Volunteer not found');
      
      volunteers[index] = { ...volunteers[index], ...updates };
      localStorage.setItem('volunteers', JSON.stringify(volunteers));
      return volunteers[index];
    },
    
    delete: async (id: string): Promise<void> => {
      const volunteers = await mockLocalStorageApi.volunteers.getAll();
      const filtered = volunteers.filter(v => v.id !== id);
      localStorage.setItem('volunteers', JSON.stringify(filtered));
    }
  },
  
  goals: {
    getAll: async (filters?: { volunteer?: string; status?: string }): Promise<Goal[]> => {
      // Try to get from localStorage first
      const stored = localStorage.getItem('goals');
      let goals = stored ? JSON.parse(stored) : mockApi.goals;
      
      // Apply filters if provided
      if (filters) {
        if (filters.volunteer) {
          goals = goals.filter((g: Goal) => g.volunteer === filters.volunteer || g.volunteerId === filters.volunteer);
        }
        if (filters.status) {
          goals = goals.filter((g: Goal) => g.status === filters.status);
        }
      }
      
      return goals;
    },
    
    getById: async (id: string): Promise<Goal | null> => {
      const goals = await mockLocalStorageApi.goals.getAll();
      return goals.find(g => g.id === id) || null;
    },
    
    create: async (goalData: Omit<Goal, 'id' | 'createdDate' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
      const goals = await mockLocalStorageApi.goals.getAll();
      const now = new Date().toISOString();
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        createdDate: now,
        createdAt: now,
        updatedAt: now,
        description: goalData.description || '',
        tags: goalData.tags || [],
        notes: goalData.notes || '',
      };
      goals.push(newGoal);
      localStorage.setItem('goals', JSON.stringify(goals));
      return newGoal;
    },
    
    update: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
      const goals = await mockLocalStorageApi.goals.getAll();
      const index = goals.findIndex(g => g.id === id);
      if (index === -1) throw new Error('Goal not found');
      
      goals[index] = { 
        ...goals[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('goals', JSON.stringify(goals));
      return goals[index];
    },
    
    delete: async (id: string): Promise<void> => {
      const goals = await mockLocalStorageApi.goals.getAll();
      const filtered = goals.filter(g => g.id !== id);
      localStorage.setItem('goals', JSON.stringify(filtered));
    },
    
    updateProgress: async (id: string, progress: number, notes?: string): Promise<Goal> => {
      const updates: Partial<Goal> = { progress };
      if (notes) updates.notes = notes;
      return mockLocalStorageApi.goals.update(id, updates);
    }
  },
  
  admin: {
    getProfile: async (): Promise<AdminProfile> => {
      const stored = localStorage.getItem('adminProfile');
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Initialize with default data and current stats
      const volunteers = await mockLocalStorageApi.volunteers.getAll();
      const goals = await mockLocalStorageApi.goals.getAll();
      
      const defaultProfile = {
        ...mockApi.adminProfile,
        stats: {
          ...mockApi.adminProfile.stats,
          totalVolunteersManaged: volunteers.length,
          totalGoalsOversaw: goals.length
        }
      };
      
      localStorage.setItem('adminProfile', JSON.stringify(defaultProfile));
      return defaultProfile;
    },
    
    updateProfile: async (updates: Partial<AdminProfile>): Promise<AdminProfile> => {
      const currentProfile = await mockLocalStorageApi.admin.getProfile();
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('adminProfile', JSON.stringify(updatedProfile));
      return updatedProfile;
    },
    
    updatePreferences: async (preferences: Partial<AdminProfile['preferences']>): Promise<AdminProfile> => {
      const currentProfile = await mockLocalStorageApi.admin.getProfile();
      const updatedProfile = {
        ...currentProfile,
        preferences: {
          ...currentProfile.preferences,
          ...preferences
        }
      };
      
      localStorage.setItem('adminProfile', JSON.stringify(updatedProfile));
      return updatedProfile;
    },
    
    changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
      // Simulate password validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would validate the current password and update it
      // For demo purposes, we'll just return success
      return true;
    }
  }
};

// Main API object - use mock data in development
export const api = {
  // Goals
  goals: {
    getAll: mockLocalStorageApi.goals.getAll,
    getById: mockLocalStorageApi.goals.getById,
    create: mockLocalStorageApi.goals.create,
    update: mockLocalStorageApi.goals.update,
    delete: mockLocalStorageApi.goals.delete,
    updateProgress: mockLocalStorageApi.goals.updateProgress,
  },

  // Volunteers
  volunteers: {
    getAll: mockLocalStorageApi.volunteers.getAll,
    getById: mockLocalStorageApi.volunteers.getById,
    create: mockLocalStorageApi.volunteers.create,
    update: mockLocalStorageApi.volunteers.update,
    delete: mockLocalStorageApi.volunteers.delete,
    getPerformance: async (id: string, dateRange?: { start: string; end: string }) => {
      const goals = await mockLocalStorageApi.goals.getAll({ volunteer: id });
      return calculatePerformanceMetrics(goals);
    },
    updateStatus: async (id: string, status: 'active' | 'inactive') => {
      return mockLocalStorageApi.volunteers.update(id, { status });
    },
  },

  // Admin - ADD THIS TO FIX THE ERROR
  admin: {
    getProfile: mockLocalStorageApi.admin.getProfile,
    updateProfile: mockLocalStorageApi.admin.updateProfile,
    updatePreferences: mockLocalStorageApi.admin.updatePreferences,
    changePassword: mockLocalStorageApi.admin.changePassword,
  },

  // Analytics
  analytics: {
    getSystemOverview: async (dateRange?: { start: string; end: string }) => {
      const volunteers = await api.volunteers.getAll();
      const goals = await api.goals.getAll();
      
      return {
        totalVolunteers: volunteers.length,
        activeVolunteers: volunteers.filter(v => v.status === 'active').length,
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        completionRate: calculateCompletionRate(goals),
        overdueGoals: getOverdueGoals(goals).length
      };
    },
    getVolunteerPerformance: async (filters?: any) => {
      const volunteers = await api.volunteers.getAll();
      return volunteers.map(v => ({
        id: v.id,
        name: v.name,
        performance: v.performance,
        completionRate: v.completionRate,
        goalsCount: v.goalsCount
      }));
    },
    exportReport: async (type: string, filters?: any) => {
      const data = await api.analytics.getSystemOverview();
      return { downloadUrl: '#', data };
    },
  },

  // Settings
  settings: {
    get: async () => {
      const stored = localStorage.getItem('systemSettings');
      return stored ? JSON.parse(stored) : {
        organizationName: 'X3 Lab',
        emailNotifications: true,
        weeklyReports: true,
        autoReminders: true
      };
    },
    update: async (settings: any) => {
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      return settings;
    },
  },
};

// Helper functions
export const calculateCompletionRate = (goals: Goal[]): number => {
  if (goals.length === 0) return 0;
  const completed = goals.filter(g => g.status === 'completed').length;
  return Math.round((completed / goals.length) * 100);
};

export const getOverdueGoals = (goals: Goal[]): Goal[] => {
  const now = new Date();
  return goals.filter(g => {
    if (!g.dueDate) return false;
    const dueDate = new Date(g.dueDate);
    return dueDate < now && g.status !== 'completed';
  });
};

export const getMonthlyChanges = async () => {
  // Mock implementation for monthly changes
  return {
    volunteers: 5,
    goals: 12,
    completion: 8,
    overdue: -2
  };
};

export const calculatePerformanceMetrics = (goals: Goal[]) => {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const overdue = getOverdueGoals(goals).length;
  const averageProgress = totalGoals > 0 
    ? goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals 
    : 0;

  return {
    totalGoals,
    completedGoals,
    completionRate: calculateCompletionRate(goals),
    overdue,
    averageProgress: Math.round(averageProgress)
  };
};

// Create query client with default options
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for mock data
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});