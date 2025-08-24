import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Award, 
  Clock,
  BarChart3,
  History,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import PersonalAnalytics from '../components/PersonalAnalytics';
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
      console.log('Loading volunteer dashboard data...');
      
      if (!user?.id) {
        throw new Error('User ID not available');
      }

      // Load goals using the correct API method
      const goalsResponse = await goalsApi.getMyGoals(); // This returns Goal[] directly
      setGoals(goalsResponse); // No need to access .goals property

      // Load trends and analytics
      const [trendsData, analyticsData] = await Promise.all([
        progressHistoryApi.getMyTrends().catch(error => {
          console.warn('Failed to load trends:', error);
          return null;
        }),
        analyticsApi.getPersonalAnalytics(user.id).catch(error => {
          console.warn('Failed to load analytics:', error);
          return null;
        })
      ]);

      setTrends(trendsData);
      setAnalytics(analyticsData);

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
    await loadDashboardData();
    setRefreshing(false);
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

  // Calculate statistics
  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in-progress').length,
    pending: goals.filter(g => g.status === 'pending').length,
    overdue: goals.filter(g => g.status === 'overdue').length,
    averageProgress: goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0,
    completionRate: goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0
  };

  if (loading) {
    return (
      <VolunteerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </VolunteerLayout>
    );
  }

  return (
    <VolunteerLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-gray-600">
            Track your goals and monitor your progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refreshData} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowCreateGoal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Overview Content */}
      <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Goals</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.completionRate}%</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Progress Summary */}
          <WeeklyProgressSummary 
            volunteerId={user?.id}
            onSubmitWeeklyReport={refreshData}
          />

          {/* Recent Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Goals
              </CardTitle>
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
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No goals yet</p>
                  <Button onClick={() => setShowCreateGoal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Trends Preview */}
          {trends && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{trends.overallAverageProgress}%</div>
                    <div className="text-sm text-blue-700">Overall Avg Progress</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{trends.overallCompletionRate}%</div>
                    <div className="text-sm text-green-700">Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{trends.weeklyTrends.length}</div>
                    <div className="text-sm text-purple-700">Weeks Tracked</div>
                  </div>
                </div>
                <div className="mt-4">
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Goal</h2>
              <EnhancedGoalForm
                onSubmit={handleCreateGoal}
                onCancel={() => setShowCreateGoal(false)}
                volunteerId={user?.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </VolunteerLayout>
  );
};

export default VolunteerDashboard;