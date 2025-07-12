
import React, { useState } from 'react';
import { Calendar, Flag, Edit, Trash2, Check, Clock, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import ProgressUpdate from './ProgressUpdate';

interface ProgressEntry {
  id: string;
  timestamp: string;
  progress: number;
  notes: string;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  progress: number;
  progressHistory: ProgressEntry[];
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onProgressUpdate: (goalId: number, progress: number, notes: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onProgressUpdate 
}) => {
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleProgressUpdate = (goalId: number, progress: number, notes: string) => {
    onProgressUpdate(goalId, progress, notes);
    
    // Auto-update status based on progress
    if (progress === 100) {
      onStatusChange(goalId, 'completed');
    } else if (progress > 0 && goal.status === 'pending') {
      onStatusChange(goalId, 'in-progress');
    }
  };

  const handleMarkComplete = (goalId: number) => {
    onProgressUpdate(goalId, 100, 'Goal marked as complete');
    onStatusChange(goalId, 'completed');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{goal.title}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
              <Flag className="h-3 w-3 inline mr-1" />
              {goal.priority}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
              {getStatusIcon(goal.status)}
              <span className="ml-1 capitalize">{goal.status.replace('-', ' ')}</span>
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3">{goal.description}</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-indigo-600">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            Due: {formatDate(goal.dueDate)}
          </div>
          <div className="text-sm text-gray-500">
            Created: {formatDate(goal.createdAt)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {goal.status !== 'completed' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProgressUpdate(!showProgressUpdate)}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Update Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(goal.id, goal.status === 'pending' ? 'in-progress' : 'completed')}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {goal.status === 'pending' ? 'Start' : 'Complete'}
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(goal)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(goal.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Update Component */}
        {showProgressUpdate && goal.status !== 'completed' && (
          <ProgressUpdate
            goalId={goal.id}
            currentProgress={goal.progress}
            progressHistory={goal.progressHistory}
            onProgressUpdate={handleProgressUpdate}
            onMarkComplete={handleMarkComplete}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default GoalCard;