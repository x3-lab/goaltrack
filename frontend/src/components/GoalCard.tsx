import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Flag, 
  Edit, 
  Trash2, 
  Check, 
  Clock, 
  TrendingUp, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Save,
  X
} from 'lucide-react';
import { Goal, ProgressEntry } from '@/types/goal';

interface GoalCardProps {
  goal: Goal;
  onUpdate: (goalId: string, updates: Partial<Goal>) => void;
  onDelete: (goalId: string) => void;
  onProgressUpdate: (goalId: string, progress: number, notes: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  onUpdate, 
  onDelete, 
  onProgressUpdate 
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editData, setEditData] = useState({
    title: goal.title,
    description: goal.description,
    notes: goal.notes || ''
  });
  const [progressData, setProgressData] = useState({
    progress: goal.progress,
    notes: ''
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-l-red-500 bg-red-50';
      case 'Medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'Low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-300 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (newStatus: 'pending' | 'in-progress' | 'completed') => {
    let newProgress = goal.progress;
    
    if (newStatus === 'completed') {
      newProgress = 100;
    } else if (newStatus === 'in-progress' && goal.progress === 0) {
      newProgress = 10; // Start with 10% when moving to in-progress
    }

    onUpdate(goal.id, { 
      status: newStatus, 
      progress: newProgress,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: "Status Updated",
      description: `Goal status changed to ${newStatus.replace('-', ' ')}`,
    });
  };

  const handleSaveEdit = () => {
    onUpdate(goal.id, {
      title: editData.title,
      description: editData.description,
      notes: editData.notes,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
    toast({
      title: "Goal Updated",
      description: "Your changes have been saved",
    });
  };

  const handleProgressSubmit = () => {
    if (progressData.notes.trim()) {
      onProgressUpdate(goal.id, progressData.progress, progressData.notes);
      setProgressData({ progress: progressData.progress, notes: '' });
      setShowProgressUpdate(false);
      
      // Auto-update status based on progress
      if (progressData.progress === 100 && goal.status !== 'completed') {
        handleStatusChange('completed');
      } else if (progressData.progress > 0 && goal.status === 'pending') {
        handleStatusChange('in-progress');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isEditing) {
    return (
      <Card className={`border-l-4 ${getPriorityColor(goal.priority)}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Edit Goal</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes about this goal..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 ${getPriorityColor(goal.priority)} transition-all duration-200 hover:shadow-md`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`px-2 py-1 text-xs ${goal.priority === 'High' ? 'bg-red-100 text-red-800' : goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                <Flag className="h-3 w-3 mr-1" />
                {goal.priority}
              </Badge>
              <Badge className={`px-2 py-1 text-xs ${getStatusColor(goal.status)}`}>
                {goal.status === 'completed' ? <Check className="h-3 w-3 mr-1" /> : 
                 goal.status === 'in-progress' ? <Clock className="h-3 w-3 mr-1" /> : 
                 <Calendar className="h-3 w-3 mr-1" />}
                {goal.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(goal.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-600">{goal.description}</p>
        
        {goal.notes && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Notes</span>
            </div>
            <p className="text-sm text-blue-700">{goal.notes}</p>
          </div>
        )}

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold text-blue-600">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        {/* Due Date */}
        {goal.dueDate && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            Due: {new Date(goal.dueDate).toLocaleDateString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {goal.status !== 'completed' && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowProgressUpdate(!showProgressUpdate)}
                className="flex items-center gap-1"
              >
                <TrendingUp className="h-4 w-4" />
                Update Progress
              </Button>
              
              {goal.status === 'pending' && (
                <Button 
                  size="sm" 
                  onClick={() => handleStatusChange('in-progress')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Start Goal
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('completed')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            </>
          )}
          
          {goal.progressHistory.length > 0 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              History ({goal.progressHistory.length})
            </Button>
          )}
        </div>

        {/* Progress Update Form */}
        {showProgressUpdate && (
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="progress">Progress: {progressData.progress}%</Label>
                <input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progressData.progress}
                  onChange={(e) => setProgressData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label htmlFor="progressNotes">Progress Notes *</Label>
                <Textarea
                  id="progressNotes"
                  value={progressData.notes}
                  onChange={(e) => setProgressData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Describe your progress, challenges, or achievements..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleProgressSubmit}
                  disabled={!progressData.notes.trim()}
                >
                  Submit Update
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowProgressUpdate(false);
                    setProgressData({ progress: goal.progress, notes: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress History */}
        {showHistory && goal.progressHistory.length > 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Progress History</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {goal.progressHistory.slice(-5).reverse().map((entry) => (
                  <div key={entry.id} className="border-b border-gray-200 pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{entry.progress}%</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};