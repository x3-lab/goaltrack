
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp, Award } from 'lucide-react';

const VolunteerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Mock volunteer data - in a real app this would come from API
  const volunteer = {
    id: id || '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'volunteer',
    status: 'active',
    joinDate: '2024-01-15',
    lastActive: '2024-07-09',
    goalsCount: 8,
    completedGoals: 6,
    completionRate: 75,
    performanceScore: 85,
  };

  const goals = [
    {
      id: '1',
      title: 'Complete React Training',
      status: 'completed',
      progress: 100,
      category: 'Learning',
      dueDate: '2024-06-30',
    },
    {
      id: '2',
      title: 'Organize Community Event',
      status: 'in-progress',
      progress: 60,
      category: 'Community',
      dueDate: '2024-08-15',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Volunteer Profile</h1>
        <Badge variant={volunteer.status === 'active' ? 'default' : 'secondary'}>
          {volunteer.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{volunteer.name}</h3>
              <p className="text-gray-600">{volunteer.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Join Date:</span>
                <span className="text-sm">{volunteer.joinDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Active:</span>
                <span className="text-sm">{volunteer.lastActive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Performance Score:</span>
                <span className="text-sm font-semibold">{volunteer.performanceScore}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{volunteer.goalsCount}</div>
                <div className="text-sm text-gray-600">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{volunteer.completedGoals}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{volunteer.completionRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{volunteer.completionRate}%</span>
              </div>
              <Progress value={volunteer.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{goal.title}</h4>
                  <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                    {goal.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{goal.category}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {goal.dueDate}
                  </span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="text-right text-sm text-gray-600 mt-1">
                  {goal.progress}% complete
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerProfile;