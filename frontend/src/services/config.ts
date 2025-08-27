export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL
    : 'http://localhost:3000',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    STATUS: (id: string) => `/users/${id}/status`,
    GOALS: (id: string) => `/users/${id}/goals`,
    ACTIVITY: (id: string) => `/users/${id}/activity`,
  },
  GOALS: {
    BASE: '/goals',
    BY_ID: (id: string) => `/goals/${id}`,
    STATISTICS: '/goals/statistics',
    CATEGORIES: '/goals/categories',
    PROGRESS: (id: string) => `/goals/${id}/progress`,
    BULK_UPDATE: '/goals/bulk/update',
    PROCESS_OVERDUE: '/goals/process-overdue',
    WEEKLY_PROCESSING: '/goals/weekly-processing',
  },
  ANALYTICS: {
    SYSTEM_OVERVIEW: '/analytics/system-overview',
    USER_PERFORMANCE: '/analytics/user-performance',
    GOAL_METRICS: '/analytics/goal-metrics',
    ACTIVITY_TRENDS: '/analytics/activity-trends',
  },
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    GOALS: '/admin/goals',
    ACTIVITY_LOGS: '/admin/activity-logs',
  },
  PROGRESS_HISTORY: {
    BASE: '/progress-history',
    BY_GOAL: (goalId: string) => `/progress-history/goal/${goalId}`,
    BY_USER: (userId: string) => `/progress-history/user/${userId}`,
  },
  GOAL_TEMPLATES: {
    BASE: '/goal-templates',
    BY_ID: (id: string) => `/goal-templates/${id}`,
    CATEGORIES: '/goal-templates/categories',
    POPULAR: '/goal-templates/popular',
    USE: (id: string) => `/goal-templates/${id}/use`,
  },
} as const;