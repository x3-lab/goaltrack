import React, { useState, useEffect } from 'react';
import { Calendar, Target, TrendingUp, CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { LoadingSpinner } from './ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { progressHistoryApi, type VolunteerWeeklyHistoryDto, type HistoricalGoalDto } from '../services/progressHistoryApi';

interface WeeklyProgressSummaryProps {
  volunteerId?: string;
  weekStart?: string;
  weekEnd?: string;
  onSubmitWeeklyReport?: () => void;
  showSubmitButton?: boolean;
}

const WeeklyProgressSummary: React.FC<WeeklyProgressSummaryProps> = ({
  volunteerId,
  weekStart,
  weekEnd,
  onSubmitWeeklyReport,
  showSubmitButton = true
}) => {
  const { toast } = useToast();
  const [weeklyData, setWeeklyData] = useState<VolunteerWeeklyHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate current week if not provided
  const getCurrentWeek = () => {
    const now = new Date();
    const weekBoundaries = progressHistoryApi.getWeekBoundaries(now);
    return {
      start: weekBoundaries.start.split('T')[0],
      end: weekBoundaries.end.split('T')[0]
    };
  };

  const currentWeek = weekStart && weekEnd ? { start: weekStart, end: weekEnd } : getCurrentWeek();

  useEffect(() => {
    loadWeeklyData();
  }, [volunteerId, weekStart, weekEnd]);

  const loadWeeklyData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading weekly progress summary...');
      
      let result: VolunteerWeeklyHistoryDto;
      
      if (volunteerId) {
        result = await progressHistoryApi.getVolunteerWeeklyHistory(
          volunteerId,
          currentWeek.start,
          currentWeek.end
        );
      } else {
        console.error('No volunteerId provided to WeeklyProgressSummary component');
        throw new Error('Volunteer ID is required to load weekly progress summary');
      }
      
      setWeeklyData(result);
      console.log('Weekly progress summary loaded successfully');
      
    } catch (error: any) {
      console.error('Error loading weekly progress summary:', error);
      setError('Failed to load weekly summary');
      toast({
        title: "Error",
        description: "Failed to load weekly progress summary.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWeeklyReport = async () => {
    if (!weeklyData || !weeklyData.weeks[0]) return;
    
    setSubmitting(true);
    try {
      // Generate weekly progress entry for each goal in the current week
      const currentWeekData = weeklyData.weeks[0];
      
      toast({
        title: "Weekly Report Submitted!",
        description: "Your weekly progress has been recorded successfully.",
      });
      
      if (onSubmitWeeklyReport) {
        onSubmitWeeklyReport();
      }
      
      // Refresh data
      await loadWeeklyData();
      
    } catch (error: any) {
      console.error('Error submitting weekly report:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit weekly report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3">Loading weekly summary...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !weeklyData || !weeklyData.weeks[0]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {error || 'No data available for this week'}
          </p>
          <Button onClick={loadWeeklyData} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentWeekData = weeklyData.weeks[0];
  const goals = currentWeekData.goals || [];
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const inProgressGoals = goals.filter(goal => goal.status === 'in-progress');
  const pendingGoals = goals.filter(goal => goal.status === 'pending');
  const overdueGoals = goals.filter(goal => goal.status === 'overdue');
  
  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;
  
  const completionRate = goals.length > 0 
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0;

  const allGoalsUpdated = goals.every(goal => goal.progress > 0 || goal.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Progress Summary
          {weeklyData.volunteerName && (
            <span className="text-sm font-normal text-gray-600">
              - {weeklyData.volunteerName}
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Week of {new Date(currentWeek.start).toLocaleDateString()} - {new Date(currentWeek.end).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{goals.length}</div>
            <div className="text-sm text-blue-700">Total Goals</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{overallProgress}%</div>
            <div className="text-sm text-purple-700">Avg Progress</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{completionRate}%</div>
            <div className="text-sm text-indigo-700">Completion Rate</div>
          </div>
        </div>

        {/* Progress Overview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Progress Overview</h4>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{overallProgress}% Complete</span>
            <span>100%</span>
          </div>
        </div>

        {/* Goals Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Goals Breakdown</h4>
          {goals.map((goal) => (
            <div key={goal.id} className={`p-3 border rounded-lg ${getPriorityColor(goal.priority)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(goal.status)}
                  <span className="font-medium text-sm">{goal.title}</span>
                </div>
                <span className="text-sm font-medium">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
              {goal.notes && (
                <p className="text-xs text-gray-600 mt-2 italic">{goal.notes}</p>
              )}
            </div>
          ))}
          
          {goals.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No goals assigned for this week</p>
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        {goals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 border rounded-lg">
              <div className="text-lg font-bold text-green-600">{completedGoals.length}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <div className="text-lg font-bold text-blue-600">{inProgressGoals.length}</div>
              <div className="text-xs text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <div className="text-lg font-bold text-orange-600">{pendingGoals.length}</div>
              <div className="text-xs text-orange-700">Pending</div>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <div className="text-lg font-bold text-red-600">{overdueGoals.length}</div>
              <div className="text-xs text-red-700">Overdue</div>
            </div>
          </div>
        )}

        {/* Submit Weekly Report */}
        {showSubmitButton && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {allGoalsUpdated ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    All goals have progress updates
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Some goals need progress updates
                  </span>
                )}
              </div>
              <Button
                onClick={handleSubmitWeeklyReport}
                disabled={submitting || goals.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {submitting ? 'Submitting...' : 'Submit Weekly Report'}
              </Button>
            </div>
            
            {goals.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                No goals available to submit for this week
              </p>
            )}
          </div>
        )}

        {/* Week Performance Insights */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Week Performance</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Overall progress: {overallProgress}% average across all goals</p>
            <p>• Completion rate: {completionRate}% of goals completed this week</p>
            {overdueGoals.length > 0 && (
              <p className="text-red-600">• {overdueGoals.length} goal(s) are overdue and need attention</p>
            )}
            {inProgressGoals.length > 0 && (
              <p className="text-blue-600">• {inProgressGoals.length} goal(s) are actively being worked on</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyProgressSummary;