import { api, calculateCompletionRate, getOverdueGoals, getMonthlyChanges, calculatePerformanceMetrics, type Goal, type Volunteer, type AdminProfile } from './api';

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isActive: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'deadline' | 'overdue' | 'completion' | 'inactivity';
  conditions: any;
  actions: any;
  enabled: boolean;
  createdAt: string;
}

export interface AdminGoal {
  id: string;
  title: string;
  description: string;
  volunteer: string;
  volunteerName: string;
  volunteerEmail: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  dueDate: string;
  createdDate: string;
  updatedAt: string;
  category: string;
  tags: string[];
  notes?: string;
}

export const adminApi = {
  // Dashboard data
  getDashboardStats: async () => {
    try {
      const volunteers = await api.volunteers.getAll();
      const goals = await api.goals.getAll();
      
      return {
        activeVolunteers: volunteers.filter((v: Volunteer) => v.status === 'active').length,
        totalGoals: goals.length,
        completionRate: calculateCompletionRate(goals),
        overdueGoals: getOverdueGoals(goals).length,
        monthlyChanges: await getMonthlyChanges()
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Goals management for admin
  getAllGoals: async (filters?: {
    status?: string;
    priority?: string;
    volunteer?: string;
    category?: string;
    search?: string;
  }): Promise<AdminGoal[]> => {
    try {
      const [goals, volunteers] = await Promise.all([
        api.goals.getAll(),
        api.volunteers.getAll()
      ]);

      // Create a map for quick volunteer lookup
      const volunteerMap = new Map(volunteers.map(v => [v.id, v]));

      // Transform goals to admin format with volunteer information
      let adminGoals: AdminGoal[] = goals.map((goal: Goal) => {
        const volunteer = volunteerMap.get(goal.volunteer || goal.volunteerId || '');
        const isOverdue = goal.dueDate && new Date(goal.dueDate) < new Date() && goal.status !== 'completed';
        
        return {
          id: goal.id,
          title: goal.title,
          description: goal.description || '',
          volunteer: goal.volunteer || goal.volunteerId || '',
          volunteerName: volunteer ? volunteer.name : 'Unknown Volunteer',
          volunteerEmail: volunteer ? volunteer.email : '',
          priority: goal.priority,
          status: isOverdue ? 'overdue' : goal.status,
          progress: goal.progress,
          dueDate: goal.dueDate,
          createdDate: goal.createdDate || goal.createdAt,
          updatedAt: goal.updatedAt || goal.createdAt,
          category: goal.category,
          tags: goal.tags || [],
          notes: goal.notes
        };
      });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          adminGoals = adminGoals.filter(goal => goal.status === filters.status);
        }
        if (filters.priority && filters.priority !== 'all') {
          adminGoals = adminGoals.filter(goal => goal.priority === filters.priority);
        }
        if (filters.volunteer && filters.volunteer !== 'all') {
          adminGoals = adminGoals.filter(goal => goal.volunteer === filters.volunteer);
        }
        if (filters.category && filters.category !== 'all') {
          adminGoals = adminGoals.filter(goal => goal.category === filters.category);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          adminGoals = adminGoals.filter(goal => 
            goal.title.toLowerCase().includes(searchLower) ||
            goal.volunteerName.toLowerCase().includes(searchLower) ||
            goal.category.toLowerCase().includes(searchLower) ||
            goal.description.toLowerCase().includes(searchLower)
          );
        }
      }

      return adminGoals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  getGoalById: async (goalId: string): Promise<AdminGoal | null> => {
    try {
      const goals = await adminApi.getAllGoals();
      return goals.find(goal => goal.id === goalId) || null;
    } catch (error) {
      console.error('Error fetching goal:', error);
      throw error;
    }
  },

  updateGoalStatus: async (goalId: string, status: 'pending' | 'in-progress' | 'completed'): Promise<AdminGoal> => {
    try {
      const updates: Partial<Goal> = { 
        status,
        updatedAt: new Date().toISOString()
      };
      
      // If marking as completed, set progress to 100
      if (status === 'completed') {
        updates.progress = 100;
      }
      
      await api.goals.update(goalId, updates);
      const updatedGoal = await adminApi.getGoalById(goalId);
      
      if (!updatedGoal) {
        throw new Error('Goal not found after update');
      }
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal status:', error);
      throw error;
    }
  },

  updateGoalPriority: async (goalId: string, priority: 'High' | 'Medium' | 'Low'): Promise<AdminGoal> => {
    try {
      const updates: Partial<Goal> = { 
        priority,
        updatedAt: new Date().toISOString()
      };
      
      await api.goals.update(goalId, updates);
      
      const updatedGoal = await adminApi.getGoalById(goalId);
      if (!updatedGoal) {
        throw new Error('Goal not found after update');
      }
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal priority:', error);
      throw error;
    }
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    try {
      await api.goals.delete(goalId);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  getGoalStatistics: async () => {
    try {
      const goals = await adminApi.getAllGoals();
      
      const total = goals.length;
      const completed = goals.filter(g => g.status === 'completed').length;
      const inProgress = goals.filter(g => g.status === 'in-progress').length;
      const pending = goals.filter(g => g.status === 'pending').length;
      const overdue = goals.filter(g => g.status === 'overdue').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        inProgress,
        pending,
        overdue,
        completionRate
      };
    } catch (error) {
      console.error('Error calculating goal statistics:', error);
      throw error;
    }
  },

  getUniqueCategories: async (): Promise<string[]> => {
    try {
      const goals = await adminApi.getAllGoals();
      const categories = [...new Set(goals.map(goal => goal.category))];
      return categories.filter(Boolean).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  getVolunteersWithGoals: async () => {
    try {
      const [goals, volunteers] = await Promise.all([
        adminApi.getAllGoals(),
        api.volunteers.getAll()
      ]);

      return volunteers.map(volunteer => ({
        ...volunteer,
        goalsCount: goals.filter(goal => goal.volunteer === volunteer.id).length,
        completedGoalsCount: goals.filter(goal => 
          goal.volunteer === volunteer.id && goal.status === 'completed'
        ).length
      }));
    } catch (error) {
      console.error('Error fetching volunteers with goals:', error);
      throw error;
    }
  },

  // Analytics data
  getAnalyticsData: async (dateRange: { start: string; end: string }) => {
    try {
      const volunteers = await api.volunteers.getAll();
      const goals = await api.goals.getAll();
      
      // Filter goals by date range
      const filteredGoals = goals.filter((goal: Goal) => {
        const goalDate = new Date(goal.createdDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return goalDate >= startDate && goalDate <= endDate;
      });

      // Generate analytics data
      const dailyCompletionTrends = generateDailyCompletionTrends(filteredGoals, dateRange);
      const weeklyCompletionTrends = generateWeeklyCompletionTrends(filteredGoals, dateRange);
      const performanceDistribution = generatePerformanceDistribution(volunteers);
      const categoryBreakdown = generateCategoryBreakdown(filteredGoals);
      const volunteerActivity = generateVolunteerActivity(volunteers, filteredGoals);

      return {
        overview: {
          totalVolunteers: volunteers.length,
          activeVolunteers: volunteers.filter((v: Volunteer) => v.status === 'active').length,
          totalGoals: filteredGoals.length,
          completedGoals: filteredGoals.filter((g: Goal) => g.status === 'completed').length,
          completionRate: calculateCompletionRate(filteredGoals),
          overdueGoals: getOverdueGoals(filteredGoals).length
        },
        completionTrends: {
          daily: dailyCompletionTrends,
          weekly: weeklyCompletionTrends
        },
        performanceDistribution,
        categoryBreakdown,
        volunteerActivity
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  },

  // Volunteer management
  getVolunteerPerformance: async (volunteerId: string) => {
    try {
      const goals = await api.goals.getAll({ volunteer: volunteerId });
      return calculatePerformanceMetrics(goals);
    } catch (error) {
      console.error('Error fetching volunteer performance:', error);
      throw error;
    }
  },

  // Bulk operations
  bulkUpdateGoals: async (goalIds: string[], updates: Partial<Goal>) => {
    try {
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return Promise.all(goalIds.map(id => api.goals.update(id, updatesWithTimestamp)));
    } catch (error) {
      console.error('Error bulk updating goals:', error);
      throw error;
    }
  },

  sendBulkReminders: async (volunteerIds: string[]) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Sent reminders to ${volunteerIds.length} volunteers`);
      return { success: true, count: volunteerIds.length };
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      throw error;
    }
  },

  exportVolunteerData: async (volunteerIds: string[]) => {
    try {
      const volunteers = await api.volunteers.getAll();
      const selectedVolunteers = volunteers.filter((v: Volunteer) => volunteerIds.includes(v.id));
      
      const dataToExport = {
        volunteers: selectedVolunteers,
        exportDate: new Date().toISOString(),
        count: selectedVolunteers.length
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volunteers-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting volunteer data:', error);
      throw error;
    }
  },

  // Reporting
  generateReport: async (type: 'overview' | 'performance' | 'goals', filters?: any) => {
    try {
      const volunteers = await api.volunteers.getAll();
      const goals = await api.goals.getAll();
      
      const reportData = {
        type,
        generatedAt: new Date().toISOString(),
        summary: {
          totalVolunteers: volunteers.length,
          activeVolunteers: volunteers.filter((v: Volunteer) => v.status === 'active').length,
          totalGoals: goals.length,
          completedGoals: goals.filter((g: Goal) => g.status === 'completed').length,
          completionRate: calculateCompletionRate(goals)
        },
        volunteers,
        goals,
        filters
      };
      
      return JSON.stringify(reportData, null, 2);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // Goal template management
  getGoalTemplates: async (): Promise<GoalTemplate[]> => {
    try {
      const templates = JSON.parse(localStorage.getItem('goalTemplates') || '[]');
      
      // Add some default templates if none exist
      if (templates.length === 0) {
        const defaultTemplates: GoalTemplate[] = [
          {
            id: '1',
            name: 'Safety Training',
            description: 'Complete mandatory safety training course',
            category: 'Training',
            priority: 'High' as const,
            defaultDuration: 7,
            usageCount: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['safety', 'training', 'mandatory'],
            isActive: true
          },
          {
            id: '2',
            name: 'Community Outreach',
            description: 'Organize community outreach event',
            category: 'Community',
            priority: 'Medium' as const,
            defaultDuration: 14,
            usageCount: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['community', 'outreach', 'event'],
            isActive: true
          }
        ];
        localStorage.setItem('goalTemplates', JSON.stringify(defaultTemplates));
        return defaultTemplates;
      }
      
      return templates;
    } catch (error) {
      console.error('Error fetching goal templates:', error);
      return [];
    }
  },

  createGoalTemplate: async (templateData: Omit<GoalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<GoalTemplate> => {
    try {
      const templates = await adminApi.getGoalTemplates();
      const newTemplate: GoalTemplate = {
        ...templateData,
        id: Date.now().toString(),
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      templates.push(newTemplate);
      localStorage.setItem('goalTemplates', JSON.stringify(templates));
      return newTemplate;
    } catch (error) {
      console.error('Error creating goal template:', error);
      throw error;
    }
  },

  updateGoalTemplate: async (id: string, updates: Partial<GoalTemplate>): Promise<GoalTemplate> => {
    try {
      const templates = await adminApi.getGoalTemplates();
      const index = templates.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Template not found');
      
      templates[index] = { 
        ...templates[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      localStorage.setItem('goalTemplates', JSON.stringify(templates));
      return templates[index];
    } catch (error) {
      console.error('Error updating goal template:', error);
      throw error;
    }
  },

  deleteGoalTemplate: async (id: string): Promise<void> => {
    try {
      const templates = await adminApi.getGoalTemplates();
      const filtered = templates.filter(t => t.id !== id);
      localStorage.setItem('goalTemplates', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting goal template:', error);
      throw error;
    }
  },

  duplicateGoalTemplate: async (templateId: string): Promise<GoalTemplate> => {
    try {
      const templates = await adminApi.getGoalTemplates();
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      const duplicated: GoalTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      templates.push(duplicated);
      localStorage.setItem('goalTemplates', JSON.stringify(templates));
      return duplicated;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  },

  // Notification management
  getNotificationRules: async (): Promise<NotificationRule[]> => {
    try {
      const rules = JSON.parse(localStorage.getItem('notificationRules') || '[]');
      
      // Add some default rules if none exist
      if (rules.length === 0) {
        const defaultRules: NotificationRule[] = [
          {
            id: '1',
            name: 'Goal Deadline Reminder',
            description: 'Send reminder 24 hours before goal deadline',
            trigger: 'deadline' as const,
            conditions: { timeBeforeDeadline: 24 },
            actions: { sendEmail: true, sendNotification: true },
            enabled: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Overdue Goal Alert',
            description: 'Alert when goals become overdue',
            trigger: 'overdue' as const,
            conditions: { daysOverdue: 1 },
            actions: { sendEmail: true, notifyAdmin: true },
            enabled: true,
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('notificationRules', JSON.stringify(defaultRules));
        return defaultRules;
      }
      
      return rules;
    } catch (error) {
      console.error('Error fetching notification rules:', error);
      return [];
    }
  },

  createNotificationRule: async (ruleData: Omit<NotificationRule, 'id' | 'createdAt'>): Promise<NotificationRule> => {
    try {
      const rules = await adminApi.getNotificationRules();
      const newRule: NotificationRule = {
        ...ruleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      rules.push(newRule);
      localStorage.setItem('notificationRules', JSON.stringify(rules));
      return newRule;
    } catch (error) {
      console.error('Error creating notification rule:', error);
      throw error;
    }
  },

  updateNotificationRule: async (id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> => {
    try {
      const rules = await adminApi.getNotificationRules();
      const index = rules.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Rule not found');
      
      rules[index] = { ...rules[index], ...updates };
      localStorage.setItem('notificationRules', JSON.stringify(rules));
      return rules[index];
    } catch (error) {
      console.error('Error updating notification rule:', error);
      throw error;
    }
  },

  sendManualNotification: async (notificationData: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would send emails/notifications
      console.log('Manual notification sent:', notificationData);
      
      // Save to notification history
      const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
      history.push({
        id: Date.now().toString(),
        ...notificationData,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
      localStorage.setItem('notificationHistory', JSON.stringify(history));
      
      return { success: true };
    } catch (error) {
      console.error('Error sending manual notification:', error);
      throw error;
    }
  },

  // Admin Profile Management
  getAdminProfile: async (): Promise<AdminProfile> => {
    try {
      return await api.admin.getProfile();
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      throw error;
    }
  },

  updateAdminProfile: async (updates: Partial<AdminProfile>): Promise<AdminProfile> => {
    try {
      return await api.admin.updateProfile(updates);
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  },

  updateAdminPreferences: async (preferences: Partial<AdminProfile['preferences']>): Promise<AdminProfile> => {
    try {
      return await api.admin.updatePreferences(preferences);
    } catch (error) {
      console.error('Error updating admin preferences:', error);
      throw error;
    }
  },

  changeAdminPassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      return await api.admin.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Error changing admin password:', error);
      throw error;
    }
  }
};

export type { AdminProfile }

// Helper functions for analytics
function generateDailyCompletionTrends(goals: Goal[], dateRange: { start: string; end: string }) {
  const trends = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Limit to reasonable number of days for daily view
  const daysToShow = Math.min(totalDays, 30);
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayGoals = goals.filter(g => {
      const goalDate = new Date(g.createdDate);
      return goalDate >= dayStart && goalDate <= dayEnd;
    });
    
    const dayCompletedGoals = goals.filter(g => {
      const goalDate = new Date(g.createdDate);
      return goalDate >= dayStart && goalDate <= dayEnd && g.status === 'completed';
    });
    
    trends.push({
      date: date.toISOString().split('T')[0],
      completed: dayCompletedGoals.length,
      total: dayGoals.length,
      period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }
  
  return trends;
}

function generateWeeklyCompletionTrends(goals: Goal[], dateRange: { start: string; end: string }) {
  const trends = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  // Get the start of the week (Sunday) for the start date
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  let currentWeekStart = new Date(weekStart);
  
  while (currentWeekStart <= endDate) {
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const weekGoals = goals.filter(g => {
      const goalDate = new Date(g.createdDate);
      return goalDate >= currentWeekStart && goalDate <= currentWeekEnd;
    });
    
    const weekCompletedGoals = weekGoals.filter(g => g.status === 'completed');
    
    // Format week label
    const weekLabel = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    trends.push({
      date: currentWeekStart.toISOString().split('T')[0],
      completed: weekCompletedGoals.length,
      total: weekGoals.length,
      period: weekLabel
    });
    
    // Move to next week
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return trends;
}

function generatePerformanceDistribution(volunteers: Volunteer[]) {
  const distribution = { high: 0, medium: 0, low: 0 };
  
  volunteers.forEach(v => {
    if (v.performance) {
      distribution[v.performance as keyof typeof distribution]++;
    }
  });
  
  return [
    { name: 'High Performance', value: distribution.high },
    { name: 'Medium Performance', value: distribution.medium },
    { name: 'Low Performance', value: distribution.low }
  ];
}

function generateCategoryBreakdown(goals: Goal[]) {
  const categories: { [key: string]: number } = {};
  
  goals.forEach(goal => {
    categories[goal.category] = (categories[goal.category] || 0) + 1;
  });
  
  return Object.entries(categories).map(([name, value]) => ({ name, value }));
}

function generateVolunteerActivity(volunteers: Volunteer[], goals: Goal[]) {
  return volunteers.map(volunteer => ({
    name: volunteer.name,
    totalGoals: goals.filter(g => g.volunteer === volunteer.id).length,
    completedGoals: goals.filter(g => g.volunteer === volunteer.id && g.status === 'completed').length,
    completionRate: volunteer.completionRate || 0
  }));
}