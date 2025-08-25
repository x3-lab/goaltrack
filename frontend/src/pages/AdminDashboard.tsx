import React, { useState, useCallback } from 'react';
import { Users, Target, TrendingUp, AlertTriangle, Plus, FileText, UserPlus, RefreshCw, Activity, Calendar, Bell, Settings, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useRealTimeDashboard } from '../hooks/useRealTimeDashboard';
import {
  adminApi,
  type VolunteerWithGoalsDto
} from '../services/adminApi';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Local state for non-real-time data
  const [volunteersWithGoals, setVolunteersWithGoals] = useState<VolunteerWithGoalsDto[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time dashboard hook with enhanced error handling
  const {
    data: dashboardData,
    refresh: refreshDashboard,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshEnabled
  } = useRealTimeDashboard({
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableAutoRefresh: true,
    onError: (error) => {
      console.error('Real-time dashboard error:', error);
      // Only show toast for critical errors, not auto-refresh failures
      if (!error.message.includes('auto-refresh')) {
        toast({
          title: "Dashboard Error",
          description: error.message || "Failed to update dashboard data",
          variant: "destructive"
        });
      }
    },
    onUpdate: (data) => {
      console.log('✅ Dashboard data updated:', {
        stats: !!data.stats,
        activityCount: data.recentActivity.length,
        deadlinesCount: data.upcomingDeadlines.length,
        isOnline: data.isOnline
      });
    }
  });

  // Load volunteers data separately (less frequent updates needed)
  const loadVolunteersData = useCallback(async () => {
    try {
      setVolunteersLoading(true);
      const volunteers = await adminApi.getVolunteersWithGoals();
      setVolunteersWithGoals(volunteers);
      return volunteers;
    } catch (error: any) {
      console.error('Error loading volunteers:', error);
      // Return error to handle in calling function
      throw error;
    } finally {
      setVolunteersLoading(false);
    }
  }, []); // Empty dependency array to prevent re-creation

  // Initialize volunteers data on mount
  React.useEffect(() => {
    loadVolunteersData().catch((error) => {
      toast({
        title: "Error",
        description: "Failed to load volunteer data",
        variant: "destructive"
      });
    });
  }, []); // Empty dependency array - only run once on mount

  // Comprehensive refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Refresh both real-time and volunteer data
      await Promise.all([
        refreshDashboard(),
        loadVolunteersData()
      ]);
      
      toast({
        title: "Dashboard Refreshed",
        description: "All data has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Refresh Error",
        description: error.message || "Failed to refresh dashboard",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh control
  const toggleAutoRefresh = () => {
    if (isAutoRefreshEnabled) {
      stopAutoRefresh();
      toast({
        title: "Auto-refresh Disabled",
        description: "Dashboard will no longer auto-update",
      });
    } else {
      startAutoRefresh();
      toast({
        title: "Auto-refresh Enabled",
        description: "Dashboard will update every 5 minutes",
      });
    }
  };

  const handleSendReminder = async (deadlineId: string) => {
    try {
      const deadline = dashboardData.upcomingDeadlines.find(d => d.id === deadlineId);
      if (!deadline) return;

      // TODO: Replace with actual API call when backend endpoint is available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Reminder Sent",
        description: `Reminder sent to ${deadline.volunteer} about "${deadline.goal}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-volunteer':
        navigate('/admin-dashboard/volunteers');
        break;
      case 'create-template':
        navigate('/admin-dashboard/goal-templates');
        break;
      case 'view-reports':
        navigate('/admin-dashboard/analytics');
        break;
      case 'manage-settings':
        navigate('/admin-dashboard/settings');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeIndicator = (change: number, suffix: string = '') => {
    if (change > 0) {
      return (
        <span className="text-green-600 text-sm font-medium">
          +{change}{suffix} ↗
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-red-600 text-sm font-medium">
          {change}{suffix} ↘
        </span>
      );
    } else {
      return (
        <span className="text-gray-600 text-sm font-medium">
          No change
        </span>
      );
    }
  };

  // Loading state for initial load
  if (dashboardData.loading && !dashboardData.stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Dashboard</h3>
            <p className="text-gray-600">Fetching the latest data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state for critical failures
  if (dashboardData.error && !dashboardData.stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
          <p className="text-gray-600 mb-4">{dashboardData.error}</p>
          <Button onClick={refreshDashboard} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Active Volunteers',
      value: dashboardData.stats?.activeVolunteers.toString() || '0',
      icon: Users,
      color: 'text-blue-600',
      change: dashboardData.stats?.monthlyChanges.volunteers || 0,
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Goals',
      value: dashboardData.stats?.totalGoals.toString() || '0',
      icon: Target,
      color: 'text-green-600',
      change: dashboardData.stats?.monthlyChanges.goals || 0,
      bgColor: 'bg-green-50'
    },
    {
      label: 'Completion Rate',
      value: `${dashboardData.stats?.completionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      change: dashboardData.stats?.monthlyChanges.completion || 0,
      suffix: '%',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Overdue Goals',
      value: dashboardData.stats?.overdueGoals.toString() || '0',
      icon: AlertTriangle,
      color: 'text-red-600',
      change: dashboardData.stats?.monthlyChanges.overdue || 0,
      bgColor: 'bg-red-50'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Real-time Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back. Here's your organization overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2 mr-4">
              {dashboardData.isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>

            {/* Last Updated */}
            {dashboardData.lastUpdated && (
              <div className="text-sm text-gray-500 mr-4">
                Last updated: {formatTimeAgo(dashboardData.lastUpdated.toISOString())}
              </div>
            )}

            {/* Auto-refresh Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoRefresh}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isAutoRefreshEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              Auto-refresh {isAutoRefreshEnabled ? 'On' : 'Off'}
            </Button>

            {/* Manual Refresh */}
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              disabled={refreshing || dashboardData.loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing || dashboardData.loading ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Loading Overlay for Updates */}
        {dashboardData.loading && dashboardData.stats && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-blue-800">Updating...</span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {dashboardData.error && dashboardData.stats && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Update Warning</h4>
                <p className="text-sm text-yellow-700">{dashboardData.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards with Real-time Updates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <div className="mt-2">
                        {getChangeIndicator(stat.change, stat.suffix)}
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor} transition-colors duration-200`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  
                  {/* Real-time update indicator */}
                  {dashboardData.lastUpdated && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                className="justify-start h-auto p-4 transition-all duration-200 hover:scale-105" 
                variant="outline"
                onClick={() => handleQuickAction('add-volunteer')}
              >
                <UserPlus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Add New Volunteer</p>
                  <p className="text-sm text-gray-500">Register a new team member</p>
                </div>
              </Button>
              
              <Button 
                className="justify-start h-auto p-4 transition-all duration-200 hover:scale-105" 
                variant="outline"
                onClick={() => handleQuickAction('create-template')}
              >
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Create Goal Template</p>
                  <p className="text-sm text-gray-500">Set up reusable goal templates</p>
                </div>
              </Button>

              <Button 
                className="justify-start h-auto p-4 transition-all duration-200 hover:scale-105" 
                variant="outline"
                onClick={() => handleQuickAction('view-reports')}
              >
                <FileText className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">View Reports</p>
                  <p className="text-sm text-gray-500">Generate analytics reports</p>
                </div>
              </Button>

              <Button 
                className="justify-start h-auto p-4 transition-all duration-200 hover:scale-105" 
                variant="outline"
                onClick={() => handleQuickAction('manage-settings')}
              >
                <Settings className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">System Settings</p>
                  <p className="text-sm text-gray-500">Configure system preferences</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                    {dashboardData.recentActivity.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {dashboardData.recentActivity.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Latest volunteer actions and updates</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin-dashboard/volunteer-management')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:bg-gray-50 -mx-3 px-3 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.userName}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium">{activity.resource}</span>
                          {activity.details?.goalTitle && (
                            <span className="text-gray-600"> "{activity.details.goalTitle}"</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Deadlines
                    {dashboardData.upcomingDeadlines.length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 ${dashboardData.upcomingDeadlines.some(d => d.daysUntilDeadline <= 3) ? 'bg-red-100 text-red-800' : ''}`}
                      >
                        {dashboardData.upcomingDeadlines.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Goals nearing their due dates</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin-dashboard/goals')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {dashboardData.upcomingDeadlines.length > 0 ? (
                  dashboardData.upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 transition-all duration-200 hover:bg-gray-50 -mx-3 px-3 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{deadline.goal}</p>
                        <p className="text-xs text-gray-500">{deadline.volunteer}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getPriorityColor(deadline.priority)}>
                            {deadline.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(deadline.status)}>
                            {deadline.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(deadline.deadline)}</p>
                          <p className={`text-xs ${deadline.daysUntilDeadline <= 3 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {deadline.daysUntilDeadline} day{deadline.daysUntilDeadline !== 1 ? 's' : ''} left
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendReminder(deadline.id)}
                          className="gap-1 hover:bg-blue-50"
                        >
                          <Bell className="h-4 w-4" />
                          Remind
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volunteers Overview (loaded separately) */}
        {!volunteersLoading && volunteersWithGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Volunteer Overview
                <Badge variant="secondary" className="ml-2">
                  {volunteersWithGoals.length}
                </Badge>
              </CardTitle>
              <CardDescription>Performance summary of active volunteers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {volunteersWithGoals.slice(0, 5).map((volunteer) => (
                  <div key={volunteer.volunteerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{volunteer.volunteerName}</h4>
                        <span className="text-sm text-gray-600">{volunteer.completionRate}% completion</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{volunteer.totalGoals} total goals</span>
                        <span>{volunteer.completedGoals} completed</span>
                        <span>{volunteer.inProgressGoals} in progress</span>
                      </div>
                      <Progress value={volunteer.completionRate} className="mt-2 h-2" />
                    </div>
                  </div>
                ))}
              </div>
              {volunteersWithGoals.length > 5 && (
                <div className="text-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin-dashboard/volunteers')}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    View All Volunteers ({volunteersWithGoals.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Volunteers Loading State */}
        {volunteersLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Volunteer Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-gray-600">Loading volunteer data...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;