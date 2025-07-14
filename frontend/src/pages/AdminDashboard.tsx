import React, { useState, useEffect } from 'react';
import { Users, Target, TrendingUp, AlertTriangle, Plus, FileText, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';

interface DashboardStats {
  activeVolunteers: number;
  totalGoals: number;
  completionRate: number;
  overdueGoals: number;
  monthlyChanges: {
    volunteers: number;
    goals: number;
    completion: number;
    overdue: number;
  };
}

interface Activity {
  id: string;
  user: string;
  action: string;
  goal: string;
  time: string;
  timestamp: string | Date;
}

interface Deadline {
  id: string;
  volunteer: string;
  volunteerEmail: string;
  goal: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load real statistics from API
      const statsData = await adminApi.getDashboardStats();
      setStats(statsData);

      // Load recent activity from localStorage (mock data)
      const activityData: Activity[] = JSON.parse(localStorage.getItem('recentActivity') || '[]');
      
      // If no activity data, create some mock data
      if (activityData.length === 0) {
        const mockActivity = [
          {
            id: '1',
            user: 'Sarah Johnson',
            action: 'completed',
            goal: 'First Aid Training',
            time: '2 hours ago',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            user: 'Mike Chen',
            action: 'started',
            goal: 'Community Outreach',
            time: '4 hours ago',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            user: 'Emma Davis',
            action: 'updated progress on',
            goal: 'Fundraising Event',
            time: '6 hours ago',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem('recentActivity', JSON.stringify(mockActivity));
        setRecentActivity(mockActivity);
      } else {
        // Ensure timestamps are properly handled
        const processedActivity = activityData.map(activity => ({
          ...activity,
          timestamp: typeof activity.timestamp === 'string' ? activity.timestamp : activity.timestamp.toISOString()
        }));
        setRecentActivity(processedActivity);
      }

      // Load upcoming deadlines
      const deadlinesData: Deadline[] = JSON.parse(localStorage.getItem('upcomingDeadlines') || '[]');
      
      if (deadlinesData.length === 0) {
        const mockDeadlines = [
          {
            id: '1',
            volunteer: 'Sarah Johnson',
            volunteerEmail: 'sarah.johnson@email.com',
            goal: 'Complete Safety Training',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high' as const,
            status: 'in-progress' as const
          },
          {
            id: '2',
            volunteer: 'Mike Chen',
            volunteerEmail: 'mike.chen@email.com',
            goal: 'Submit Monthly Report',
            deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'medium' as const,
            status: 'pending' as const
          }
        ];
        localStorage.setItem('upcomingDeadlines', JSON.stringify(mockDeadlines));
        setUpcomingDeadlines(mockDeadlines);
      } else {
        setUpcomingDeadlines(deadlinesData);
      }

    } catch (error) {
      console.error('Dashboard loading error:', error);
      setError('Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolunteer = () => {
    navigate('/admin-dashboard/volunteers');
  };

  const handleCreateGoalTemplate = () => {
    navigate('/admin-dashboard/goal-templates');
  };

  const handleSendReminder = async (deadlineId: string) => {
    try {
      const deadline = upcomingDeadlines.find(d => d.id === deadlineId);
      if (!deadline) return;

      // Simulate API call to send reminder
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Reminder Sent",
        description: `Reminder sent to ${deadline.volunteer} about "${deadline.goal}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const targetDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // Check if the date is valid
    if (isNaN(targetDate.getTime())) {
      return 'Invalid date';
    }
    
    const diff = now.getTime() - targetDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Active Volunteers', 
      value: stats?.activeVolunteers.toString() || '0', 
      icon: Users, 
      color: 'text-blue-600', 
      change: `+${stats?.monthlyChanges.volunteers || 0}`,
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Total Goals', 
      value: stats?.totalGoals.toString() || '0', 
      icon: Target, 
      color: 'text-green-600', 
      change: `+${stats?.monthlyChanges.goals || 0}`,
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Completion Rate', 
      value: `${stats?.completionRate || 0}%`, 
      icon: TrendingUp, 
      color: 'text-purple-600', 
      change: `+${stats?.monthlyChanges.completion || 0}%`,
      bgColor: 'bg-purple-50'
    },
    { 
      label: 'Overdue Goals', 
      value: stats?.overdueGoals.toString() || '0', 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      change: `${stats?.monthlyChanges.overdue || 0}`,
      bgColor: 'bg-red-50'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}. Here's your organization overview.</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <span className={`text-sm font-medium ${
                        stat.change.startsWith('+') ? 'text-green-600' : 
                        stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">from last month</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="justify-start h-auto p-4" 
              variant="outline"
              onClick={handleAddVolunteer}
            >
              <UserPlus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Add New Volunteer</p>
                <p className="text-sm text-gray-500">Register a new team member</p>
              </div>
            </Button>
            <Button 
              className="justify-start h-auto p-4" 
              variant="outline"
              onClick={handleCreateGoalTemplate}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Create Goal Template</p>
                <p className="text-sm text-gray-500">Set up reusable goal templates</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest volunteer actions and updates</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin-dashboard/volunteer-management')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user} {activity.action} "{activity.goal}"
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin-dashboard/volunteer-management`)}>
                      View Details
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Goals requiring attention</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin-dashboard/goals')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.goal}</p>
                      <p className="text-xs text-gray-500">{item.volunteer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{new Date(item.deadline).toLocaleDateString()}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendReminder(item.id)}
                      >
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;