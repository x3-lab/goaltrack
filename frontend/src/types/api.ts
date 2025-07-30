
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'volunteer';
  status: 'active' | 'inactive';
  phone?: string;
  address?: string;
  skills?: string;
  notes?: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  dueDate: string;
  volunteerId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
  volunteerName?: string;
}

export interface ProgressHistory {
  id: string;
  goalId: string;
  userId: string;
  progress: number;
  notes?: string;
  timestamp: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  timestamp: string;
}

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  scope: 'global' | 'user';
  userId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'volunteer';
  phone?: string;
  address?: string;
  skills?: string;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  volunteerId?: string;
  tags?: string[];
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  tags?: string[];
  notes?: string;
}

export interface GoalProgressRequest {
  progress: number;
  notes?: string;
}

export interface GoalFilters {
  status?: string;
  priority?: string;
  category?: string;
  volunteerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GoalStatistics {
  totalGoals: number;
  completedGoals: number;
  pendingGoals: number;
  inProgressGoals: number;
  overdueGoals: number;
  completionRate: number;
  averageProgress: number;
  categoriesCount: number;
  upcomingDeadlines: Goal[];
}

export interface SystemOverview {
  totalUsers: number;
  activeUsers: number;
  totalGoals: number;
  completedGoals: number;
  goalCompletionRate: number;
  averageGoalsPerUser: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: ActivityLog[];
}

export interface UserPerformance {
  userId: string;
  userName: string;
  goalsCompleted: number;
  averageCompletionTime: number;
  completionRate: number;
  streak: number;
  lastActivityDate: string;
}

export interface ActivityTrend {
  date: string;
  goalCreations: number;
  goalCompletions: number;
  userRegistrations: number;
  activeUsers: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

export interface BulkUpdateGoalsRequest {
  goalIds: string[];
  updates: Partial<UpdateGoalRequest>;
}

export interface BulkUpdateResponse {
  message: string;
  updatedGoals: number;
}