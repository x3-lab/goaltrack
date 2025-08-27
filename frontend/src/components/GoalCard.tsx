import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  User, 
  TrendingUp, 
  Check, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  History,
  Target,
  AlertCircle,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { LoadingSpinner } from './ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { progressHistoryApi, type ProgressHistoryResponseDto } from '../services/progressHistoryApi';
import ProgressUpdate from './ProgressUpdate';
import { Goal } from '@/types/api';



interface GoalCardProps {
  goal: Goal;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
  showVolunteerInfo?: boolean;
  compact?: boolean;
  onProgressUpdate?: (goalId: string, progress: number, notes: string) => void;
  onMarkComplete?: (goalId: string) => Promise<void>;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  onUpdate, 
  onDelete, 
  showVolunteerInfo = false, 
  compact = false,
  onProgressUpdate,
  onMarkComplete
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressHistoryResponseDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editData, setEditData] = useState({
    title: goal.title,
    description: goal.description || '',
    notes: goal.notes || []
  });
  const [progressData, setProgressData] = useState({
    progress: goal.progress,
    notes: ''
  });

  useEffect(() => {
    if (showProgressHistory) {
      loadProgressHistory();
    }
  }, [showProgressHistory, goal.id]);

  const loadProgressHistory = async () => {
    setLoadingHistory(true);
    try {
      console.log(`📊 Loading progress history for goal ${goal.id}...`);
      
      const result = await progressHistoryApi.getAll({
        goalId: goal.id,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        limit: 10
      });
      
      setProgressHistory(result.progressHistory);
      console.log('Progress history loaded successfully');
      
    } catch (error: any) {
      console.error('Error loading progress history:', error);
      toast({
        title: "Error",
        description: "Failed to load progress history.",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (newStatus: 'pending' | 'in-progress' | 'completed') => {
    let newProgress = goal.progress;
    
    if (newStatus === 'completed') {
      newProgress = 100;
    } else if (newStatus === 'in-progress' && goal.progress === 0) {
      newProgress = 10; // Start with 10% when moving to in-progress
    }

    try {
      // Update goal status and progress
      onUpdate(goal.id, { 
        status: newStatus, 
        progress: newProgress,
        updatedAt: new Date().toISOString()
      });

      // Create progress history entry
      try {
        const statusNote = newStatus === 'completed' 
          ? '🎉Goal marked as complete!' 
          : `Status changed to ${newStatus.replace('-', ' ')}`;
        
        // Refresh history if visible
        if (showProgressHistory) {
          setTimeout(() => loadProgressHistory(), 500);
        }
      } catch (historyError) {
        console.warn('Failed to create status change history entry:', historyError);
      }

      toast({
        title: "Status Updated",
        description: `Goal status changed to ${newStatus.replace('-', ' ')}`,
      });

    } catch (error: any) {
      console.error('Error updating goal status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update goal status",
        variant: "destructive"
      });
    }
  };

  const handleSaveEdit = () => {
    onUpdate(goal.id, {
      title: editData.title,
      description: editData.description,
      notes: editData.notes
    });
    setIsEditing(false);
    
    toast({
      title: "Goal Updated",
      description: "Goal details have been saved successfully.",
    });
  };

  const handleProgressSubmit = async () => {
    if (!progressData.notes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please add notes to describe your progress update.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update goal progress
      if (onProgressUpdate) {
        await onProgressUpdate(goal.id, progressData.progress, progressData.notes);
      } else {
        onUpdate(goal.id, { 
          progress: progressData.progress,
          updatedAt: new Date().toISOString()
        });
      }

      setShowProgressUpdate(false);
      setProgressData({ progress: progressData.progress, notes: '' });
      
      toast({
        title: "Progress Updated",
        description: `Progress updated to ${progressData.progress}% with your notes recorded.`,
      });

    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const handleMarkComplete = async () => {
    try {
      if (onMarkComplete) {
        await onMarkComplete(goal.id);
      } else {
        await handleStatusChange('completed');
      }
    } catch (error: any) {
      console.error('Error marking goal complete:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark goal as complete",
        variant: "destructive"
      });
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

  const getProgressChangeIcon = (current: number, previous?: number) => {
    if (!previous) return <Target className="h-3 w-3 text-blue-500" />;
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (current < previous) return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
    return <Target className="h-3 w-3 text-gray-400" />;
  };

  const getProgressBadgeColor = (progress: number) => {
    if (progress === 100) return "bg-green-100 text-green-800";
    if (progress >= 75) return "bg-blue-100 text-blue-800";
    if (progress >= 50) return "bg-yellow-100 text-yellow-800";
    if (progress >= 25) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <Badge 
        variant="outline"
        className={`text-xs ${priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.medium}`}
      >
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    return (
      <Badge 
        variant="outline"
        className={`text-xs ${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}
      >
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  // Compact version
  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{goal.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getPriorityColor(goal.priority)} size="sm">
                  {goal.priority}
                </Badge>
                <Badge className={getStatusColor(goal.status)} size="sm">
                  {goal.status.replace('-', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                {/* <Edit3 className="h-3 w-3" /> */}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-1" />
          </div>

          {goal.dueDate && (
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <Calendar className="h-3 w-3 mr-1" />
              Due: {new Date(goal.dueDate).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="font-medium"
                />
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description..."
                  rows={2}
                />
              </div>
            ) : (
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {goal.title}
                  {goal.progress === 100 && <Star className="h-4 w-4 text-yellow-500" />}
                </CardTitle>
                {goal.description && (
                  <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Badge className={getPriorityColor(goal.priority)}>
              {goal.priority}
            </Badge>
            <Badge className={getStatusColor(goal.status)}>
              {goal.status.replace('-', ' ')}
            </Badge>
          </div>
        </div>

        {/* Volunteer Info */}
        {showVolunteerInfo && goal.volunteerName && (
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <User className="h-4 w-4 mr-1" />
            Assigned to: {goal.volunteerName}
          </div>
        )}

        {/* Tags */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {goal.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div>
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

        {/* Notes */}
        {(goal.notes || isEditing) && (
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            {isEditing ? (
              <Textarea
                value={Array.isArray(editData.notes) ? editData.notes.join('\n') : ''}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value.split('\n') }))}
                placeholder="Add any notes or comments (one per line)..."
                rows={3}
                className="mt-1"
              />
            ) : goal.notes && goal.notes.length > 0 ? (
              <p className="text-sm text-gray-600 mt-1">{Array.isArray(goal.notes) ? goal.notes.join('\n') : goal.notes}</p>
            ) : (
              <p className="text-sm text-gray-400 mt-1 italic">No notes added</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
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
                    onClick={handleMarkComplete}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Complete
                  </Button>
                </>
              )}
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowProgressHistory(!showProgressHistory)}
                className="flex items-center gap-1"
              >
                <History className="h-4 w-4" />
                Progress History
              </Button>
              
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button size="sm" variant="outline" onClick={() => onDelete(goal.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>

        {/* Progress Update Form */}
        {showProgressUpdate && !isEditing && (
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

        {/* Enhanced Progress History */}
        {showProgressHistory && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Progress History
                </h4>
                <Button variant="ghost" size="sm" onClick={loadProgressHistory}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              
              {loadingHistory ? (
                <div className="text-center py-4">
                  <LoadingSpinner size="sm" />
                  <p className="text-sm text-gray-500 mt-2">Loading progress history...</p>
                </div>
              ) : progressHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {progressHistory.map((entry, index) => {
                    const previousEntry = progressHistory[index + 1];
                    const progressChange = previousEntry ? entry.progress - previousEntry.progress : 0;
                    
                    return (
                      <div key={entry.id} className="flex gap-3 p-3 bg-white border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getProgressBadgeColor(entry.progress)}`}>
                            {entry.progress}%
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.createdAt)}
                            {getProgressChangeIcon(entry.progress, previousEntry?.progress)}
                            {progressChange !== 0 && (
                              <Badge variant="outline" className={`text-xs ${
                                progressChange > 0 ? 'text-green-600 border-green-300' : 
                                progressChange < 0 ? 'text-red-600 border-red-300' : 'text-gray-500'
                              }`}>
                                {progressChange > 0 ? '+' : ''}{progressChange}%
                              </Badge>
                            )}
                            {entry.status && (
                              <Badge variant="outline" className="text-xs">
                                {entry.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                          {entry.category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {entry.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {progressHistory.length >= 10 && (
                    <div className="text-center py-2">
                      <Button variant="ghost" size="sm" onClick={loadProgressHistory}>
                        Load More History
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm mb-2">No progress history found</p>
                  <p className="text-gray-400 text-xs">Updates will appear here as you track your progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Progress Update Component Integration */}
        {goal.status !== 'completed' && (
          <ProgressUpdate
            goalId={goal.id}
            currentProgress={goal.progress}
            goalTitle={goal.title}
            goalStatus={goal.status}
            onUpdate={onProgressUpdate ? 
              async (progress: number, notes: string) => {
                await onProgressUpdate(goal.id, progress, notes);
              } : 
              async (progress: number, notes: string) => {
                onUpdate(goal.id, { progress, updatedAt: new Date().toISOString() });
              }
            }
            onCancel={() => {}}
            onMarkComplete={onMarkComplete ? 
              async (goalId: string) => {
                await onMarkComplete(goalId);
              } : 
              async () => {
                await handleMarkComplete();
              }
            }
            showHistory={true}
            compact={true}
          />
        )}

        {/* Meta Information */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex justify-between">
            <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
            {goal.updatedAt && (
              <span>Updated: {new Date(goal.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalCard;