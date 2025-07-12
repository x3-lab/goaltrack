
import React, { useState } from 'react';
import { Search, Filter, Target, Calendar, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

interface Goal {
  id: string;
  title: string;
  volunteer: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  dueDate: string;
  createdDate: string;
  category: string;
}

const Goals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'overdue'>('all');

  const goals: Goal[] = [
    {
      id: '1',
      title: 'Complete First Aid Training',
      volunteer: 'Sarah Johnson',
      priority: 'High',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-21',
      createdDate: '2024-01-15',
      category: 'Training'
    },
    {
      id: '2',
      title: 'Organize Community Event',
      volunteer: 'Mike Chen',
      priority: 'Medium',
      status: 'in-progress',
      progress: 75,
      dueDate: '2024-01-28',
      createdDate: '2024-01-10',
      category: 'Events'
    },
    {
      id: '3',
      title: 'Submit Monthly Report',
      volunteer: 'Emma Davis',
      priority: 'High',
      status: 'overdue',
      progress: 30,
      dueDate: '2024-01-20',
      createdDate: '2024-01-05',
      category: 'Administration'
    },
    {
      id: '4',
      title: 'Volunteer 20 Hours',
      volunteer: 'Tom Wilson',
      priority: 'Low',
      status: 'pending',
      progress: 0,
      dueDate: '2024-02-01',
      createdDate: '2024-01-12',
      category: 'Service'
    },
    {
      id: '5',
      title: 'Food Bank Assistance',
      volunteer: 'Sarah Johnson',
      priority: 'Medium',
      status: 'in-progress',
      progress: 60,
      dueDate: '2024-01-25',
      createdDate: '2024-01-08',
      category: 'Service'
    }
  ];

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.volunteer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || goal.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: Goal['priority']) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Medium</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getGoalStats = () => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const inProgress = goals.filter(g => g.status === 'in-progress').length;
    const overdue = goals.filter(g => g.status === 'overdue').length;
    const completionRate = Math.round((completed / total) * 100);

    return { total, completed, inProgress, overdue, completionRate };
  };

  const stats = getGoalStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Goals</h1>
        <p className="text-gray-600 mt-1">Monitor and manage all goals across your organization.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Goals</CardTitle>
              <CardDescription>Search and filter goals by status, priority, and volunteer</CardDescription>
            </div>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Create Goal Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search goals by title, volunteer, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'in-progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('in-progress')}
              >
                In Progress
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('overdue')}
              >
                Overdue
              </Button>
            </div>
          </div>

          {/* Goals Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{goal.title}</p>
                        <p className="text-xs text-gray-400">
                          Created {new Date(goal.createdDate).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{goal.volunteer}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(goal.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(goal.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              goal.status === 'completed' ? 'bg-green-600' :
                              goal.status === 'overdue' ? 'bg-red-600' :
                              'bg-blue-600'
                            }`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${
                        new Date(goal.dueDate) < new Date() && goal.status !== 'completed'
                          ? 'text-red-600 font-medium'
                          : 'text-gray-600'
                      }`}>
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{goal.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;