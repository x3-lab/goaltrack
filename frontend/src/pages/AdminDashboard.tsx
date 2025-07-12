
import React from 'react';
import { Users, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Active Volunteers', value: '24', icon: Users, color: 'text-blue-600', change: '+3' },
    { label: 'Total Goals', value: '156', icon: Target, color: 'text-green-600', change: '+12' },
    { label: 'Completion Rate', value: '87%', icon: TrendingUp, color: 'text-purple-600', change: '+5%' },
    { label: 'Overdue Goals', value: '8', icon: AlertTriangle, color: 'text-red-600', change: '-2' },
  ];

  const recentActivity = [
    { user: 'Sarah Johnson', action: 'completed', goal: 'First Aid Training', time: '2 hours ago' },
    { user: 'Mike Chen', action: 'started', goal: 'Community Outreach', time: '4 hours ago' },
    { user: 'Emma Davis', action: 'updated', goal: 'Fundraising Event', time: '6 hours ago' },
    { user: 'Tom Wilson', action: 'completed', goal: 'Volunteer Orientation', time: '1 day ago' },
  ];

  const upcomingDeadlines = [
    { volunteer: 'Sarah Johnson', goal: 'Complete Safety Training', deadline: '2024-01-25', priority: 'high' },
    { volunteer: 'Mike Chen', goal: 'Submit Monthly Report', deadline: '2024-01-28', priority: 'medium' },
    { volunteer: 'Emma Davis', goal: 'Event Planning Workshop', deadline: '2024-02-01', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}. Here's your organization overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                    </div>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest volunteer actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user} {activity.action} "{activity.goal}"
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.goal}</p>
                    <p className="text-xs text-gray-500">{item.volunteer}</p>
                  </div>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="justify-start h-auto p-4" variant="outline">
              <Users className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Add New Volunteer</p>
                <p className="text-sm text-gray-500">Register a new team member</p>
              </div>
            </Button>
            <Button className="justify-start h-auto p-4" variant="outline">
              <Target className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Create Goal Template</p>
                <p className="text-sm text-gray-500">Set up reusable goal templates</p>
              </div>
            </Button>
            <Button className="justify-start h-auto p-4" variant="outline">
              <TrendingUp className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Generate Report</p>
                <p className="text-sm text-gray-500">Export performance analytics</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;