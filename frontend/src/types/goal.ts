export interface ProgressEntry {
  id: string;
  timestamp: string;
  progress: number;
  notes: string;
  updatedBy?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  category: string;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  progressHistory: ProgressEntry[];
}