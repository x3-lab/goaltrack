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

// Add interfaces for Progress History
export interface HistoricalWeek {
  weekStart: string;
  weekEnd: string;
  goals: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
    progress: number;
    priority: 'High' | 'Medium' | 'Low';
    category: string;
    notes?: string;
  }>;
  completionRate: number;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
}

export interface ProgressHistoryFilters {
  volunteerId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

// Personal Analytics interfaces
export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedDate: string;
  icon: string;
}

export interface WeeklyTrend {
  week: string;
  completionRate: number;
  goalsCompleted: number;
  totalGoals: number;
}

export interface CategoryStat {
  category: string;
  completionRate: number;
  totalGoals: number;
}

export interface ProductiveDayData {
  day: string;
  completedGoals: number;
}

export interface PersonalAnalyticsData {
  overallCompletionRate: number;
  performanceScore: number;
  streakCount: number;
  weeklyTrends: WeeklyTrend[];
  achievements: Achievement[];
  categoryStats: CategoryStat[];
  productiveData: ProductiveDayData[];
}

export interface PersonalAnalyticsFilters {
  volunteerId: string;
  startDate?: string;
  endDate?: string;
}

// Helper function to get week boundaries
const getWeekBoundaries = (date: Date): { start: string; end: string } => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  
  const start = new Date(d.setDate(diff));
  const end = new Date(d.setDate(diff + 6));
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

// Helper function to generate weekly progress data
const generateWeeklyProgressData = (goals: Goal[], volunteerId: string): HistoricalWeek[] => {
  const weeklyData: { [key: string]: HistoricalWeek } = {};
  
  // Get goals for the specific volunteer
  const volunteerGoals = goals.filter(g => g.volunteer === volunteerId || g.volunteerId === volunteerId);
  
  // Generate historical weeks (last 12 weeks)
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const { start, end } = getWeekBoundaries(date);
    
    const weekGoals = volunteerGoals.filter(g => {
      const createdDate = new Date(g.createdDate);
      const weekStartDate = new Date(start);
      const weekEndDate = new Date(end);
      return createdDate >= weekStartDate && createdDate <= weekEndDate;
    });
    
    // Convert goals to historical week format
    const weekGoalData = weekGoals.map(g => ({
      id: g.id,
      title: g.title,
      status: g.status,
      progress: g.progress,
      priority: g.priority,
      category: g.category,
      notes: g.notes
    }));
    
    // If no goals for this week, create some sample goals for demonstration
    if (weekGoalData.length === 0 && i > 8) {
      // Create sample historical goals for recent weeks
      const sampleGoals = [
        {
          id: `hist-${i}-1`,
          title: `Weekly Task ${12 - i}`,
          status: Math.random() > 0.7 ? 'completed' : (Math.random() > 0.5 ? 'in-progress' : 'pending') as 'completed' | 'in-progress' | 'pending',
          progress: Math.floor(Math.random() * 100),
          priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as 'High' | 'Medium' | 'Low',
          category: ['Training & Development', 'Community Service', 'Event Planning', 'Fundraising'][Math.floor(Math.random() * 4)],
          notes: `Sample notes for week ${12 - i}`
        }
      ];
      
      if (Math.random() > 0.5) {
        sampleGoals.push({
          id: `hist-${i}-2`,
          title: `Community Goal ${12 - i}`,
          status: Math.random() > 0.6 ? 'completed' : 'in-progress' as 'completed' | 'in-progress',
          progress: Math.floor(Math.random() * 100),
          priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as 'High' | 'Medium' | 'Low',
          category: ['Community Service', 'Environmental', 'Administration'][Math.floor(Math.random() * 3)],
          notes: `Community work for week ${12 - i}`
        });
      }
      
      weekGoalData.push(...sampleGoals);
    }
    
    const completedGoals = weekGoalData.filter(g => g.status === 'completed').length;
    const avgProgress = weekGoalData.length > 0 
      ? Math.round(weekGoalData.reduce((sum, g) => sum + g.progress, 0) / weekGoalData.length)
      : 0;
    const completionRate = weekGoalData.length > 0 
      ? Math.round((completedGoals / weekGoalData.length) * 100)
      : 0;
    
    weeklyData[start] = {
      weekStart: start,
      weekEnd: end,
      goals: weekGoalData,
      totalGoals: weekGoalData.length,
      completedGoals,
      averageProgress: avgProgress,
      completionRate
    };
  }
  
  return Object.values(weeklyData).sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
};

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
    ],
    preferences: {
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
    },

    // Progress History methods
    getProgressHistory: async (filters?: ProgressHistoryFilters): Promise<HistoricalWeek[]> => {
      const goals = await mockLocalStorageApi.goals.getAll();
      const volunteerId = filters?.volunteerId || '1'; // Default to first volunteer
      
      let progressData = generateWeeklyProgressData(goals, volunteerId);
      
      // Apply filters
      if (filters) {
        if (filters.startDate) {
          progressData = progressData.filter(week => new Date(week.weekStart) >= new Date(filters.startDate!));
        }
        if (filters.endDate) {
          progressData = progressData.filter(week => new Date(week.weekEnd) <= new Date(filters.endDate!));
        }
        if (filters.status && filters.status !== 'all') {
          progressData = progressData.map(week => ({
            ...week,
            goals: week.goals.filter(goal => goal.status === filters.status)
          })).filter(week => week.goals.length > 0);
        }
        if (filters.priority && filters.priority !== 'all') {
          progressData = progressData.map(week => ({
            ...week,
            goals: week.goals.filter(goal => goal.priority === filters.priority)
          })).filter(week => week.goals.length > 0);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          progressData = progressData.map(week => ({
            ...week,
            goals: week.goals.filter(goal => 
              goal.title.toLowerCase().includes(searchLower) ||
              goal.category.toLowerCase().includes(searchLower)
            )
          })).filter(week => week.goals.length > 0);
        }
      }
      
      return progressData;
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


export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number;
  tags: string[];
  status: 'active' | 'inactive' | 'archived';
  usageCount: number;
  createdById: string;
  createdByName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Goals
  goals: {
    getAll: mockLocalStorageApi.goals.getAll,
    getById: mockLocalStorageApi.goals.getById,
    create: mockLocalStorageApi.goals.create,
    update: mockLocalStorageApi.goals.update,
    delete: mockLocalStorageApi.goals.delete,
    updateProgress: mockLocalStorageApi.goals.updateProgress,
    getProgressHistory: mockLocalStorageApi.goals.getProgressHistory,
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
    
    // Personal Analytics methods
    getPersonalAnalytics: async (filters: PersonalAnalyticsFilters): Promise<PersonalAnalyticsData> => {
      const goals = await api.goals.getAll();
      return calculatePersonalAnalytics(goals, filters.volunteerId);
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
        weeklyReports: true,
        autoReminders: true
      };
    },
    update: async (settings: any) => {
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      return settings;
    },
  },

  // Goal Templates
  goalTemplates: {
    getAll: async (filters?: {
      search?: string;
      category?: string;
      priority?: string;
      status?: string;
      page?: number;
      limit?: number;
    }): Promise<{
      templates: GoalTemplate[];
      total: number;
      page: number;
      totalPages: number;
    }> => {
      // For now, return mock data
      const mockTemplates: GoalTemplate[] = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
      
      if (mockTemplates.length === 0) {
        const defaultTemplates: GoalTemplate[] = [
          {
            id: '1',
            name: 'Safety Training',
            description: 'Complete mandatory safety training course',
            category: 'Training',
            priority: 'High',
            defaultDuration: 7,
            usageCount: 15,
            createdById: 'admin-1',
            createdByName: 'Admin User',
            status: 'active',
            tags: ['safety', 'training', 'mandatory'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            notes: 'Required for all new volunteers'
          },
          {
            id: '2',
            name: 'Community Outreach',
            description: 'Organize and participate in community outreach activities',
            category: 'Community Service',
            priority: 'Medium',
            defaultDuration: 14,
            usageCount: 8,
            createdById: 'admin-1',
            createdByName: 'Admin User',
            status: 'active',
            tags: ['community', 'outreach', 'event'],
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          },
          {
            id: '3',
            name: 'Fundraising Campaign',
            description: 'Plan and execute fundraising activities',
            category: 'Fundraising',
            priority: 'Medium',
            defaultDuration: 21,
            usageCount: 12,
            createdById: 'admin-1',
            createdByName: 'Admin User',
            status: 'active',
            tags: ['fundraising', 'campaign', 'planning'],
            createdAt: '2024-02-01T00:00:00Z',
            updatedAt: '2024-02-01T00:00:00Z'
          }
        ];
        localStorage.setItem('goalTemplates', JSON.stringify(defaultTemplates));
        return {
          templates: defaultTemplates,
          total: defaultTemplates.length,
          page: 1,
          totalPages: 1
        };
      }

      let filtered = mockTemplates;

      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower)
          );
        }
        if (filters.category && filters.category !== 'all') {
          filtered = filtered.filter(t => t.category === filters.category);
        }
        if (filters.priority && filters.priority !== 'all') {
          filtered = filtered.filter(t => t.priority === filters.priority);
        }
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(t => t.status === filters.status);
        }
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTemplates = filtered.slice(startIndex, endIndex);

      return {
        templates: paginatedTemplates,
        total: filtered.length,
        page,
        totalPages: Math.ceil(filtered.length / limit)
      };
    },

    getById: async (id: string): Promise<GoalTemplate | null> => {
      const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
      return templates.find((t: GoalTemplate) => t.id === id) || null;
    },

    create: async (templateData: Omit<GoalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'createdById' | 'createdByName'>): Promise<GoalTemplate> => {
      const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
      const newTemplate: GoalTemplate = {
        ...templateData,
        id: Date.now().toString(),
        usageCount: 0,
        createdById: 'current-user-id',
        createdByName: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      templates.push(newTemplate);
      localStorage.setItem('goalTemplates', JSON.stringify(templates));
      return newTemplate;
    },

    update: async (id: string, updates: Partial<GoalTemplate>): Promise<GoalTemplate> => {
      const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
      const index = templates.findIndex((t: GoalTemplate) => t.id === id);
      if (index === -1) throw new Error('Template not found');
      
      templates[index] = { 
        ...templates[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      localStorage.setItem('goalTemplates', JSON.stringify(templates));
      return templates[index];
    },

    delete: async (id: string): Promise<void> => {
      const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
      const filtered = templates.filter((t: GoalTemplate) => t.id !== id);
      localStorage.setItem('goalTemplates', JSON.stringify(filtered));
    },

    duplicate: async (id: string): Promise<GoalTemplate> => {
      const template = await api.goalTemplates.getById(id);
      if (!template) throw new Error('Template not found');
      
      return api.goalTemplates.create({
        ...template,
        name: `${template.name} (Copy)`,
        status: template.status,
        tags: [...template.tags],
        notes: template.notes
      });
    },

    useTemplate: async (templateId: string, goalData: {
      title: string;
      description?: string;
      dueDate: string;
      volunteerId?: string;
      customNotes?: string;
    }): Promise<Goal> => {
      const template = await api.goalTemplates.getById(templateId);
      if (!template) throw new Error('Template not found');

      // Create goal from template
      const newGoal = await api.goals.create({
        title: goalData.title,
        description: goalData.description || template.description,
        category: template.category,
        priority: template.priority,
        volunteer: goalData.volunteerId || 'current-user-id',
        dueDate: goalData.dueDate,
        tags: template.tags,
        notes: goalData.customNotes || '',
        progress: 0,
        status: 'pending'
      });

      // Increment usage count
      await api.goalTemplates.update(templateId, {
        usageCount: template.usageCount + 1
      });

      return newGoal;
    },

    getCategories: async (): Promise<string[]> => {
      const result = await api.goalTemplates.getAll();
      const categories = [...new Set(result.templates.map(t => t.category))];
      return categories.filter(Boolean).sort();
    },

    getPopular: async (limit: number = 10): Promise<GoalTemplate[]> => {
      const result = await api.goalTemplates.getAll();
      return result.templates
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    }
  }
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

// Helper functions for personal analytics
const calculatePersonalAnalytics = (goals: Goal[], volunteerId: string): PersonalAnalyticsData => {
  const volunteerGoals = goals.filter(g => g.volunteer === volunteerId || g.volunteerId === volunteerId);
  
  if (volunteerGoals.length === 0) {
    return {
      overallCompletionRate: 0,
      performanceScore: 0,
      streakCount: 0,
      weeklyTrends: [],
      achievements: [],
      categoryStats: [],
      productiveData: []
    };
  }

  // Calculate overall completion rate
  const completedGoals = volunteerGoals.filter(g => g.status === 'completed').length;
  const overallCompletionRate = Math.round((completedGoals / volunteerGoals.length) * 100);

  // Calculate performance score (weighted average of completion rate and average progress)
  const totalProgress = volunteerGoals.reduce((sum, g) => sum + g.progress, 0);
  const averageProgress = totalProgress / volunteerGoals.length;
  const performanceScore = Math.round((overallCompletionRate * 0.6) + (averageProgress * 0.4));

  // Calculate weekly trends (last 6 weeks)
  const weeklyTrends = generateWeeklyTrends(volunteerGoals);

  // Calculate streak count
  const streakCount = calculateStreakCount(weeklyTrends);

  // Generate achievements
  const achievements = generateAchievements(volunteerGoals, overallCompletionRate, streakCount);

  // Calculate category statistics
  const categoryStats = calculateCategoryStats(volunteerGoals);

  // Calculate productive days data
  const productiveData = calculateProductiveDays(volunteerGoals);

  return {
    overallCompletionRate,
    performanceScore,
    streakCount,
    weeklyTrends,
    achievements,
    categoryStats,
    productiveData
  };
};

const generateWeeklyTrends = (goals: Goal[]): WeeklyTrend[] => {
  const weeks: WeeklyTrend[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const { start, end } = getWeekBoundaries(date);
    
    const weekGoals = goals.filter(g => {
      const createdDate = new Date(g.createdDate);
      const weekStartDate = new Date(start);
      const weekEndDate = new Date(end);
      return createdDate >= weekStartDate && createdDate <= weekEndDate;
    });
    
    const completedInWeek = weekGoals.filter(g => g.status === 'completed').length;
    const completionRate = weekGoals.length > 0 ? Math.round((completedInWeek / weekGoals.length) * 100) : 0;
    
    weeks.push({
      week: new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completionRate,
      goalsCompleted: completedInWeek,
      totalGoals: weekGoals.length
    });
  }
  
  return weeks;
};

const calculateStreakCount = (weeklyTrends: WeeklyTrend[]): number => {
  let streak = 0;
  
  // Count consecutive weeks with completion rate >= 80%
  for (let i = weeklyTrends.length - 1; i >= 0; i--) {
    if (weeklyTrends[i].completionRate >= 80) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const generateAchievements = (goals: Goal[], completionRate: number, streakCount: number): Achievement[] => {
  const achievements: Achievement[] = [];
  
  // Perfect Week achievement
  if (completionRate === 100) {
    achievements.push({
      id: 'perfect-week',
      title: 'Perfect Week',
      description: 'Completed 100% of goals in a week',
      earnedDate: new Date().toISOString().split('T')[0],
      icon: '🏆'
    });
  }
  
  // Streak achievements
  if (streakCount >= 4) {
    achievements.push({
      id: 'streak-master',
      title: 'Streak Master',
      description: `Maintained ${streakCount}-week completion streak`,
      earnedDate: new Date().toISOString().split('T')[0],
      icon: '🔥'
    });
  }
  
  // Goal quantity achievements
  if (goals.length >= 10) {
    achievements.push({
      id: 'goal-setter',
      title: 'Goal Setter',
      description: 'Created 10+ goals',
      earnedDate: new Date().toISOString().split('T')[0],
      icon: '🎯'
    });
  }
  
  // High completion rate achievement
  if (completionRate >= 90) {
    achievements.push({
      id: 'high-achiever',
      title: 'High Achiever',
      description: 'Maintained 90%+ completion rate',
      earnedDate: new Date().toISOString().split('T')[0],
      icon: '🌟'
    });
  }
  
  return achievements;
};

const calculateCategoryStats = (goals: Goal[]): CategoryStat[] => {
  const categoryMap = new Map<string, { total: number; completed: number }>();
  
  goals.forEach(goal => {
    if (!categoryMap.has(goal.category)) {
      categoryMap.set(goal.category, { total: 0, completed: 0 });
    }
    
    const stats = categoryMap.get(goal.category)!;
    stats.total++;
    if (goal.status === 'completed') {
      stats.completed++;
    }
  });
  
  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    totalGoals: stats.total
  }));
};

const calculateProductiveDays = (goals: Goal[]): ProductiveDayData[] => {
  const dayMap = new Map<string, number>();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Initialize all days
  dayNames.forEach(day => dayMap.set(day, 0));
  
  // Count completed goals by day of week
  goals.filter(g => g.status === 'completed').forEach(goal => {
    const dayOfWeek = new Date(goal.updatedAt).getDay();
    const dayName = dayNames[dayOfWeek];
    dayMap.set(dayName, (dayMap.get(dayName) || 0) + 1);
  });
  
  return dayNames.map(day => ({
    day,
    completedGoals: dayMap.get(day) || 0
  }));
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