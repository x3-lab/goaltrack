# Backend API Requirements

## Data Models

1. **User/Volunteer Model**

User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'volunteer';
  position: string --> 'Frontend developer' | 'Data analyst' | 'DevOps engineer' | ...
  skills?: string;
  joinDate: Date;
  goalsCount: number; // computed field
  completionRate: number; // computed field
  lastActive: Date;
  performance: 'high' | 'medium' | 'low'; // computed field
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

2. **User/Admin Model**

Admin {
 id: string;
 name: string;
 email: string;
 password: string;
 createdAt: Date;
 updatedAt: Date;
}

3. **Goal Model**

Goal {
  id: string;
  title: string;
  description?: string;
  volunteerId: string; // foreign key to User
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  dueDate: Date;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

4. **Progress History Model**

ProgressHistory {
  id: string;
  goalId: string; // foreign key to Goal
  volunteerId: string; // foreign key to User
  progress: number;
  notes?: string;
  weekStart: Date;
  weekEnd: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: Date;
}

5. **Goal Template Model**

GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number; // days
  usageCount: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

6. **System Settings Model**

SystemSettings {
  id: string;
  key: string;
  value: JSON;
  description?: string;
  updatedAt: Date;
  updatedBy: string; // foreign key to User
}

7. **Activity Log Model**

ActivityLog {
  id: string;
  userId: string; // foreign key to User
  action: string;
  resource: string; // 'goal', 'user', 'template', etc.
  resourceId: string;
  details?: JSON;
  createdAt: Date;
}

### Database Relationships

Users (1) → (N) Goals
Users (1) → (N) ProgressHistory
Goals (1) → (N) ProgressHistory
Users (1) → (N) ActivityLog

## API Endpoints

1. **Authentication Endpoints**

POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password

2. **User/Volunteer Management**

GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
PUT /api/users/:id/status
GET /api/users/:id/performance
GET /api/users/:id/analytics
POST /api/users/bulk/export
POST /api/users/bulk/notify

3. **Goal Management**

GET /api/goals
GET /api/goals/:id
POST /api/goals
PUT /api/goals/:id
DELETE /api/goals/:id
PUT /api/goals/:id/progress
PUT /api/goals/:id/status
PUT /api/goals/:id/priority
POST /api/goals/bulk/update
GET /api/goals/statistics
GET /api/goals/categories
POST /api/goals/weekly-processing
POST /api/goals/process-overdue

4. **Progress History**

GET /api/progress-history
GET /api/progress-history/:volunteerId
POST /api/progress-history
GET /api/progress-history/:volunteerId/trends
GET /api/progress-history/:volunteerId/monthly

5. **Analytics & Reporting**

GET /api/analytics/system-overview
GET /api/analytics/completion-trends
GET /api/analytics/performance-distribution
GET /api/analytics/category-breakdown
GET /api/analytics/volunteer-activity
GET /api/analytics/personal/:volunteerId
POST /api/analytics/export

6. **Admin Dashboard**

GET /api/admin/dashboard/stats
GET /api/admin/dashboard/activity
GET /api/admin/dashboard/deadlines
GET /api/admin/profile
PUT /api/admin/profile
PUT /api/admin/preferences
POST /api/admin/change-password

7. **System Settings**

GET /api/settings
PUT /api/settings
GET /api/settings/:key
PUT /api/settings/:key


## Key Backend Features

1. **Authentication & Authorization**

- JWT-based authentication
- Role-based access control (admin vs volunteer)
- Session management
- Password reset functionality

2. **Automated Processes**

- Weekly Goal Processing: Automated job that runs weekly to:
- Create progress history entries for goals due that week
- Mark incomplete goals as "overdue"
- Generate completion statistics
- Overdue Goal Detection: Daily job to identify and mark overdue goals
- Notification System: Automated notifications based on rules

3. **Data Aggregation & Analytics**

- Real-time calculation of completion rates
- Performance metrics computation
- Trend analysis
- Category-based statistics
- Personal analytics generation

4. **File Management**

- Export functionality for reports
- Data backup and restore
- File upload for profile images

5. **Background Jobs**

- Weekly processing jobs
- Notification sending
- Data cleanup tasks
- Analytics computation


## Additional Considerations

1. **Data Validation**
- Input validation for all endpoints
- Business rule validation (e.g., due dates, progress percentages)
- File type and size validation

2. **Security**
- Rate limiting
- Input sanitization
- SQL injection prevention
- CORS configuration
- CSRF protection

3. **Performance**
- Database indexing strategy
- Caching for frequently accessed data
- Pagination for large datasets
- Query optimization

4. **Monitoring & Logging**
- API request logging
- Error tracking
- Performance monitoring
- Audit trails


## Technology Stack

### Backend Framework

Node.js (matches frontend TypeScript)
NestJS (for more structured, enterprise-grade application)

### Database

PostgreSQL (excellent for relational data with JSON support)
SQLite for now.

### Additional Services
Redis (for caching and session management)
Bull/Agenda (for background job processing)
Winston (for logging)