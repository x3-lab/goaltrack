import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Award, 
  Clock,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { goalsApi } from '../services/goalsApi';
import { progressHistoryApi, type VolunteerTrendsDto } from '../services/progressHistoryApi';
import { analyticsApi } from '../services/analyticsApi';
import { type PersonalAnalyticsDto } from '../types/analytics';
import GoalCard from '../components/GoalCard';
import WeeklyProgressSummary from '../components/WeeklyProgressSummary';
import ProgressUpdate from '../components/ProgressUpdate';
import { EnhancedGoalForm } from '../components/enhanced-goal-form';
import { Goal } from '../types/api';
import VolunteerLayout from '../components/VolunteerLayout';


const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [goals, setGoals] = useState<Goal[]>([]);
  const [trends, setTrends] = useState<VolunteerTrendsDto | null>(null);
  const [analytics, setAnalytics] = useState<PersonalAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading volunteer dashboard data...');
      
      if (!user?.id) {
        throw new Error('User ID not available');
      }

      // Load goals using the correct API method
      const goalsResponse = await goalsApi.getMyGoals();
      setGoals(goalsResponse);

      // Load trends and analytics with better error handling
      const [trendsData, analyticsData] = await Promise.allSettled([
        progressHistoryApi.getMyTrends(),
        analyticsApi.getPersonalAnalytics(user.id)
      ]);

      // Handle trends data
      if (trendsData.status === 'fulfilled') {
        setTrends(trendsData.value);
      } else {
        console.warn('Failed to load trends:', trendsData.reason);
      }

      // Handle analytics data
      if (analyticsData.status === 'fulfilled') {
        setAnalytics(analyticsData.value);
      } else {
        console.warn('Failed to load analytics:', analyticsData.reason);
      }

      console.log('Dashboard data loaded successfully');
      
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      toast({
        title: "Dashboard Refreshed",
        description: "Your data has been updated successfully.",
      });
    } catch (error) {
      // Error is already handled in loadDashboardData
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateGoal = async (goalData: any) => {
    try {
      await goalsApi.create({
        ...goalData,
        volunteerId: user?.id,
        startDate: goalData.startDate || new Date().toISOString()
      });
      await refreshData();
      setShowCreateGoal(false);
      toast({
        title: "Goal Created!",
        description: "Your new goal has been added successfully.",
      });
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      await goalsApi.update(id, updates);
      await refreshData();
      
      toast({
        title: "Goal Updated",
        description: "Goal has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const confirmMessage = `Are you sure you want to delete "${goal.title}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await goalsApi.delete(id);
      await refreshData();
      
      toast({
        title: "Goal Deleted",
        description: "Goal has been removed from your list",
      });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive"
      });
    }
  };

  const handleProgressUpdate = async (goalId: string, progress: number, notes?: string) => {
    try {
      await goalsApi.updateProgress(goalId, { progress, notes });
      await refreshData();

      toast({
        title: "Progress Updated",
        description: `Progress set to ${progress}%`,
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

  const handleMarkComplete = async (goalId: string) => {
    try {
      await goalsApi.updateStatus(goalId, 'completed');
      await refreshData();
      toast({
        title: "Goal Completed!",
        description: "Congratulations on completing your goal!",
      });
    } catch (error: any) {
      console.error('Error marking goal complete:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark goal as complete",
        variant: "destructive"
      });
    }
  };

  const handleToggleGoalStatus = async (goalId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'in-progress' : 'pending';
      await goalsApi.updateStatus(goalId, newStatus as any);
      await refreshData();
      toast({
        title: "Status Updated",
        description: `Goal ${newStatus === 'in-progress' ? 'started' : 'paused'}`,
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

  // Calculate comprehensive statistics
  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in-progress').length,
    pending: goals.filter(g => g.status === 'pending').length,
    overdue: goals.filter(g => g.status === 'overdue').length,
    averageProgress: goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0,
    completionRate: goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0,
    weeklyGoals: goals.filter(g => {
      const created = new Date(g.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created >= weekAgo;
    }).length,
    recentActivity: goals.filter(g => {
      const updated = new Date(g.updatedAt);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return updated >= threeDaysAgo;
    }).length
  };

  if (loading) {
    return (
      <VolunteerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-gray-600">Loading your dashboard...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we gather your latest data</p>
          </div>
        </div>
      </VolunteerLayout>
    );
  }

  return (
    <VolunteerLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-left">
                  Welcome back, {user?.name || 'Volunteer'}!
                </h1>
                <p className="text-gray-600 text-left">
                  Track your goals and monitor your progress towards success
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button 
              onClick={refreshData} 
              variant="outline" 
              disabled={refreshing}
              className="flex-1 lg:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              <span className="sm:hidden">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button 
              onClick={() => setShowCreateGoal(true)}
              className="flex-1 lg:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Goal</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Goals</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</p>
                  {stats.weeklyGoals > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      +{stats.weeklyGoals} this week
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.completionRate}% completion rate
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Progress</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.averageProgress}%</p>
                  <div className="mt-2">
                    <Progress value={stats.averageProgress} className="h-2" />
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Recent Activity</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.recentActivity}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    last 3 days
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview - New Addition */}
        {stats.total > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Goal Status Overview
              </CardTitle>
              <CardDescription>Current distribution of your goals by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-sm text-blue-700">In Progress</div>
                  <Progress value={(stats.inProgress / stats.total) * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                  <Progress value={(stats.pending / stats.total) * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-green-700">Completed</div>
                  <Progress value={(stats.completed / stats.total) * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-sm text-red-700">Overdue</div>
                  <Progress value={(stats.overdue / stats.total) * 100} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Goals */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Goals
              </CardTitle>
              {goals.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  Showing 3 of {goals.length}
                </Badge>
              )}
            </div>
            <CardDescription>Your most recently created or updated goals</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.slice(0, 3).length > 0 ? (
              <div className="grid gap-4">
                {goals.slice(0, 3).map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdate={handleUpdateGoal}
                    onDelete={handleDeleteGoal}
                    onProgressUpdate={handleProgressUpdate}
                    onMarkComplete={handleMarkComplete}
                    compact={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Start your journey by creating your first goal. Set targets, track progress, and achieve success!
                </p>
                <Button onClick={() => setShowCreateGoal(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Trends */}
        {trends && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Insights
              </CardTitle>
              <CardDescription>Your performance trends and achievements over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{trends.overallAverageProgress || 0}%</div>
                  <div className="text-sm text-blue-700 font-medium">Overall Avg Progress</div>
                  <div className="text-xs text-blue-600 mt-1">Across all goals</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{trends.overallCompletionRate || 0}%</div>
                  <div className="text-sm text-green-700 font-medium">Completion Rate</div>
                  <div className="text-xs text-green-600 mt-1">Success percentage</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">{trends.weeklyTrends?.length || 0}</div>
                  <div className="text-sm text-purple-700 font-medium">Weeks Tracked</div>
                  <div className="text-xs text-purple-600 mt-1">Data history</div>
                </div>
              </div>
              
              {(trends.weeklyTrends?.length || 0) > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Recent Performance</h4>
                  <div className="text-sm text-gray-600">
                    You've been tracking progress for {trends.weeklyTrends?.length || 0} weeks with an average completion rate of {trends.overallCompletionRate || 0}%. Keep up the great work!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Motivational Call-to-Action */}
        {stats.total > 0 && stats.inProgress === 0 && stats.pending > 0 && (
          <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to make progress?</h3>
              <p className="text-blue-700 mb-4">
                You have {stats.pending} pending goals waiting to be started. Take action and move them to progress!
              </p>
              <Button 
                onClick={() => {
                  const firstPendingGoal = goals.find(g => g.status === 'pending');
                  if (firstPendingGoal) {
                    handleToggleGoalStatus(firstPendingGoal.id, 'pending');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Working on Goals
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Goal</h2>
                  <p className="text-gray-600">Set a new target and start your journey to success</p>
                </div>
              </div>
              <EnhancedGoalForm
                onSubmit={handleCreateGoal}
                onCancel={() => setShowCreateGoal(false)}
                volunteerId={user?.id}
              />
            </div>
          </div>
        </div>
      )}
    </VolunteerLayout>
  );
};

export default VolunteerDashboard;