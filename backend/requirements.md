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

2. Goal Model

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

3. Progress History Model

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

4. Goal Template Model

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

5. 

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'deadline' | 'overdue' | 'completion' | 'inactivity';
  conditions: JSON; // flexible JSON field for various conditions
  actions: JSON; // flexible JSON field for various actions
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}