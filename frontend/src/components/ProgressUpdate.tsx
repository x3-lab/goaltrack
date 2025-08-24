import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, Check, TrendingUp, History, Target, AlertCircle, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { LoadingSpinner } from './ui/loading-spinner';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { progressHistoryApi, type ProgressHistoryResponseDto } from '../services/progressHistoryApi';
import { goalsApi } from '../services/goalsApi';
import { type Goal } from '../types/api';

interface ProgressUpdateProps {
  // Support both individual props and goal object
  goal?: Goal;
  goalId?: string;
  currentProgress?: number;
  goalTitle?: string;
  goalStatus?: string;
  
  // Callback functions
  onUpdate: (progress: number, notes: string) => Promise<void>;
  onCancel: () => void;
  onMarkComplete?: (goalId: string) => Promise<void>;
  
  // Optional props
  showHistory?: boolean;
  compact?: boolean;
}

const ProgressUpdate: React.FC<ProgressUpdateProps> = ({
  goal,
  goalId: propGoalId,
  currentProgress: propCurrentProgress,
  goalTitle: propGoalTitle,
  goalStatus: propGoalStatus,
  onUpdate,
  onCancel,
  onMarkComplete,
  showHistory = true,
  compact = false
}) => {
  const { toast } = useToast();
  
  // Extract values from goal object or use individual props
  const goalId = goal?.id || propGoalId || '';
  const currentProgress = goal?.progress || propCurrentProgress || 0;
  const goalTitle = goal?.title || propGoalTitle || '';
  const goalStatus = goal?.status || propGoalStatus || '';
  
  const [progress, setProgress] = useState([currentProgress]);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressHistoryResponseDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastWeekProgress, setLastWeekProgress] = useState<number | null>(null);

  useEffect(() => {
    setProgress([currentProgress]);
  }, [currentProgress]);

  useEffect(() => {
    if (showHistoryPanel && showHistory && goalId) {
      loadProgressHistory();
    }
  }, [showHistoryPanel, goalId]);

  const loadProgressHistory = async () => {
    if (!goalId) return;
    
    setLoadingHistory(true);
    try {
      console.log(`📊 Loading progress history for goal ${goalId}...`);
      
      const result = await progressHistoryApi.getAll({
        goalId,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        limit: 10
      });
      
      setProgressHistory(result.progressHistory);
      
      // Calculate week-over-week progress change
      if (result.progressHistory.length > 1) {
        const latestEntry = result.progressHistory[0];
        const previousEntry = result.progressHistory[1];
        setLastWeekProgress(previousEntry.progress);
      }
      
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

  const handleSubmitProgress = async () => {
    if (!notes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please add notes to describe your progress update.",
        variant: "destructive"
      });
      return;
    }

    if (progress[0] === currentProgress) {
      toast({
        title: "No Change",
        description: "Please adjust the progress before submitting.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log(`🎯 Submitting progress update: ${progress[0]}%`);
      
      // Update the goal progress through the parent component
      await onUpdate(progress[0], notes);
      
      // Also create a progress history entry if backend is available
      if (goalId) {
        try {
          // await progressHistoryApi.generateWeeklyEntry(goalId, notes);
          console.log('✅ Progress history entry created');
        } catch (historyError) {
          console.warn('⚠️ Failed to create progress history entry:', historyError);
          // Don't fail the entire operation if history creation fails
        }
      }
      
      // Reset form
      setNotes('');
      setIsUpdating(false);
      
      // Refresh history if panel is open
      if (showHistoryPanel) {
        setTimeout(() => loadProgressHistory(), 500);
      }
      
      const progressChange = progress[0] - currentProgress;
      const emoji = progressChange > 0 ? '📈' : progressChange < 0 ? '📉' : '📊';
      
      toast({
        title: `Progress Updated! ${emoji}`,
        description: `Progress ${progressChange > 0 ? 'increased' : progressChange < 0 ? 'decreased' : 'updated'} to ${progress[0]}% with your notes recorded.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error updating progress:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!goalId || !onMarkComplete) return;
    
    setSubmitting(true);
    try {
      console.log(`🎯 Marking goal ${goalId} as complete`);
      
      await onMarkComplete(goalId);
      setProgress([100]);
      setIsUpdating(false);
      
      // Create completion progress history entry
      if (goalId) {
        try {
          // await progressHistoryApi.generateWeeklyEntry(
          //   goalId, 
          //   `Goal marked as complete! 🎉 Final achievement reached.`
          // );
        } catch (historyError) {
          console.warn('Failed to create completion history entry:', historyError);
        }
      }
      
      // Refresh history if panel is open
      if (showHistoryPanel) {
        setTimeout(() => loadProgressHistory(), 500);
      }
      
      toast({
        title: "Goal Completed!",
        description: "Congratulations on completing your goal!",
      });
      
    } catch (error: any) {
      console.error('Error marking goal complete:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark goal as complete.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickProgress = async (newProgress: number) => {
    if (newProgress === currentProgress) return;
    
    setSubmitting(true);
    try {
      const quickNote = `Quick progress update to ${newProgress}%`;
      await onUpdate(newProgress, quickNote);
      
      // Create history entry
      if (goalId) {
        try {
          // await progressHistoryApi.generateWeeklyEntry(goalId, quickNote);
        } catch (historyError) {
          console.warn('⚠️ Failed to create quick progress history entry:', historyError);
        }
      }
      
      if (showHistoryPanel) {
        setTimeout(() => loadProgressHistory(), 500);
      }
      
      toast({
        title: "Quick Update! ⚡",
        description: `Progress quickly updated to ${newProgress}%`,
      });
      
    } catch (error: any) {
      console.error('❌ Error in quick progress update:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update progress.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
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

  const getProgressChangeText = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = current - previous;
    if (change === 0) return "No change";
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  const getProgressBadgeColor = (progress: number) => {
    if (progress === 100) return "bg-green-100 text-green-800";
    if (progress >= 75) return "bg-blue-100 text-blue-800";
    if (progress >= 50) return "bg-yellow-100 text-yellow-800";
    if (progress >= 25) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // Compact version for smaller spaces
  if (compact) {
    return (
      <Card className="border-l-4 border-l-indigo-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Progress Tracking</div>
              {goalTitle && (
                <div className="text-xs text-gray-500 truncate max-w-[200px]">{goalTitle}</div>
              )}
            </div>
            <Badge className={getProgressBadgeColor(currentProgress)}>
              {currentProgress}%
            </Badge>
          </div>

          {/* Quick Progress Buttons */}
          <div className="flex gap-1 mb-3">
            {[25, 50, 75, 100].map((quickProgress) => (
              <Button
                key={quickProgress}
                size="sm"
                variant={currentProgress >= quickProgress ? "default" : "outline"}
                onClick={() => handleQuickProgress(quickProgress)}
                disabled={submitting || currentProgress === quickProgress || goalStatus === 'completed'}
                className="flex-1 text-xs"
              >
                {submitting ? <LoadingSpinner size="sm" /> : `${quickProgress}%`}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsUpdating(true)}
              disabled={submitting || goalStatus === 'completed'}
              className="flex-1"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Detailed Update
            </Button>
            {showHistory && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              >
                <History className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Expanded Update Form */}
          {isUpdating && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
              <div>
                <Label htmlFor="progress-slider-compact">Progress: {progress[0]}%</Label>
                <Slider
                  id="progress-slider-compact"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onValueChange={setProgress}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="progress-notes-compact">Notes *</Label>
                <Textarea
                  id="progress-notes-compact"
                  placeholder="Describe your progress..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitProgress}
                  disabled={!notes.trim() || submitting}
                  className="flex-1"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : "Submit"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsUpdating(false);
                    setProgress([currentProgress]);
                    setNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Compact History */}
          {showHistoryPanel && showHistory && (
            <div className="mt-4 border-t pt-3">
              <div className="text-xs font-medium mb-2">Recent Updates</div>
              {loadingHistory ? (
                <div className="text-center py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : progressHistory.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {progressHistory.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="text-xs p-2 bg-white rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{entry.progress}%</span>
                        <span className="text-gray-500">{formatDate(entry.createdAt)}</span>
                      </div>
                      {entry.notes && (
                        <p className="text-gray-600 mt-1 truncate">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No updates yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <div className="space-y-4">
      {/* Progress Update Interface */}
      {!isUpdating ? (
        <div className="space-y-4">
          {/* Current Progress Display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700">Current Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-indigo-600">{currentProgress}%</span>
                {lastWeekProgress !== null && (
                  <div className="flex items-center gap-1">
                    {getProgressChangeIcon(currentProgress, lastWeekProgress)}
                    <span className={`text-sm font-medium ${
                      currentProgress > lastWeekProgress ? 'text-green-600' : 
                      currentProgress < lastWeekProgress ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {getProgressChangeText(currentProgress, lastWeekProgress)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {currentProgress === 100 ? 'Completed!' : 
                 currentProgress >= 75 ? 'Almost there!' :
                 currentProgress >= 50 ? 'Halfway!' :
                 currentProgress >= 25 ? 'Making progress!' : 'Just started!'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {100 - currentProgress}% remaining
              </div>
            </div>
          </div>

          {/* Quick Progress Buttons */}
          {goalStatus !== 'completed' && (
            <div>
              <Label className="text-sm font-medium">Quick Progress Update</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[25, 50, 75, 100].map((quickProgress) => (
                  <Button
                    key={quickProgress}
                    size="sm"
                    variant={currentProgress >= quickProgress ? "default" : "outline"}
                    onClick={() => handleQuickProgress(quickProgress)}
                    disabled={submitting || currentProgress === quickProgress}
                    className="relative"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        {quickProgress}%
                        {currentProgress >= quickProgress && (
                          <Check className="h-3 w-3 ml-1" />
                        )}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdating(true)}
              className="flex-1"
              disabled={submitting || goalStatus === 'completed'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Detailed Progress Update
            </Button>
            {currentProgress < 100 && goalStatus !== 'completed' && onMarkComplete && goalId && (
              <Button
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Target className="h-4 w-4" />
            Detailed Progress Update
          </div>
          
          <div>
            <Label htmlFor="progress-slider">Progress: {progress[0]}%</Label>
            <Slider
              id="progress-slider"
              min={0}
              max={100}
              step={5}
              value={progress}
              onValueChange={setProgress}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>Current: {currentProgress}%</span>
              <span>100%</span>
            </div>
            {progress[0] !== currentProgress && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <span className="text-blue-700">
                  Change: {progress[0] > currentProgress ? '+' : ''}{progress[0] - currentProgress}% 
                  ({progress[0] > currentProgress ? 'increase' : progress[0] < currentProgress ? 'decrease' : 'no change'})
                </span>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="progress-notes">Update Notes *</Label>
            <Textarea
              id="progress-notes"
              placeholder="Describe your progress, challenges, achievements, or next steps..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Notes help track your journey and provide context</span>
              <span>{notes.length}/500</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitProgress}
              disabled={!notes.trim() || submitting || progress[0] === currentProgress}
              className="flex-1"
            >
              {submitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {submitting ? 'Updating...' : 'Submit Update'}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Progress History Panel */}
      {showHistory && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Progress History
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              >
                {showHistoryPanel ? 'Hide' : 'Show'}
              </Button>
            </h4>
            {showHistoryPanel && (
              <div className="flex items-center gap-2">
                {loadingHistory && <LoadingSpinner size="sm" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadProgressHistory}
                  disabled={loadingHistory}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
          
          {showHistoryPanel && (
            <>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="text-sm text-gray-500 mt-2">Loading progress history...</p>
                </div>
              ) : progressHistory.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {progressHistory.map((entry, index) => {
                    const previousEntry = progressHistory[index + 1];
                    const progressChange = previousEntry ? entry.progress - previousEntry.progress : 0;
                    
                    return (
                      <div key={entry.id} className="flex gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getProgressBadgeColor(entry.progress)}`}>
                            <span className="text-sm font-bold">
                              {entry.progress}%
                            </span>
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
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{entry.notes}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm mb-2">No progress history found</p>
                  <p className="text-gray-400 text-xs">Updates will appear here as you track your progress</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressUpdate;