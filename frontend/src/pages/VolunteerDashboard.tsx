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
  RefreshCw,
  Filter
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
import { Goal } from '../types/api'


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
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'analytics' | 'history'>('overview');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  // Filter goals based on current filters
  const filteredGoals = goals.filter(goal => {
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || goal.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
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

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'goals', label: 'Goals', icon: Target },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            { key: 'history', label: 'History', icon: History }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
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
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('analytics')}
                    className="w-full"
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="Community Service">Community Service</option>
                  <option value="Training">Training</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Education">Education</option>
                  <option value="Administration">Administration</option>
                </select>
                {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goals List */}
          {filteredGoals.length > 0 ? (
            <div className="grid gap-4">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  onProgressUpdate={handleProgressUpdate}
                  onMarkComplete={handleMarkComplete}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  {statusFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'No goals match your current filters' 
                    : 'No goals yet'}
                </p>
                <Button onClick={() => setShowCreateGoal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <PersonalAnalytics 
          volunteerId={user?.id}
          showInsights={true}
        />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <WeeklyProgressSummary 
            volunteerId={user?.id}
            showSubmitButton={false}
          />
          
          {/* Add ProgressHistory component here when ready */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Progress History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View your complete progress history and track your journey over time.
              </p>
              <Button onClick={() => setActiveTab('analytics')}>
                View Analytics for Detailed History
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
  );
};

export default VolunteerDashboard;