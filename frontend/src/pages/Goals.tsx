import React, { useState, useEffect } from 'react';
import { Search, Filter, Target, Calendar, User, TrendingUp, RefreshCw, Edit, AlertTriangle, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '../hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { adminApi, AdminGoal } from '../services/adminApi';

interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

const Goals: React.FC = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<AdminGoal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<AdminGoal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterVolunteer, setFilterVolunteer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadGoalsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [goals, searchTerm, filterStatus, filterPriority, filterVolunteer, filterCategory]);

  const loadGoalsData = async () => {
    try {
      setLoading(true);
      
      const [goalsData, statsData, volunteersData, categoriesData] = await Promise.all([
        adminApi.getAllGoals(),
        adminApi.getGoalStatistics(),
        adminApi.getVolunteersWithGoals(),
        adminApi.getUniqueCategories()
      ]);

      setGoals(goalsData);
      setStats(statsData);
      setVolunteers(volunteersData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading goals data:', error);
      toast({
        title: "Error",
        description: "Failed to load goals data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadGoalsData();
      toast({
        title: "Data Refreshed",
        description: "Goals data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = goals;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchLower) ||
        goal.volunteerName.toLowerCase().includes(searchLower) ||
        goal.category.toLowerCase().includes(searchLower) ||
        goal.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(goal => goal.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(goal => goal.priority === filterPriority);
    }

    // Apply volunteer filter
    if (filterVolunteer !== 'all') {
      filtered = filtered.filter(goal => goal.volunteer === filterVolunteer);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(goal => goal.category === filterCategory);
    }

    setFilteredGoals(filtered);
  };

  const handleStatusChange = async (goalId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      await adminApi.updateGoalStatus(goalId, newStatus);
      await loadGoalsData(); // Reload to get updated stats
      
      toast({
        title: "Status Updated",
        description: `Goal status changed to ${newStatus.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive"
      });
    }
  };

  const handlePriorityChange = async (goalId: string, newPriority: 'High' | 'Medium' | 'Low') => {
    try {
      await adminApi.updateGoalPriority(goalId, newPriority);
      await loadGoalsData();
      
      toast({
        title: "Priority Updated",
        description: `Goal priority changed to ${newPriority}`,
      });
    } catch (error) {
      console.error('Error updating goal priority:', error);
      toast({
        title: "Error",
        description: "Failed to update goal priority",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${goalTitle}"?`)) {
      try {
        await adminApi.deleteGoal(goalId);
        await loadGoalsData();
        
        toast({
          title: "Goal Deleted",
          description: "Goal has been successfully deleted",
        });
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast({
          title: "Error",
          description: "Failed to delete goal",
          variant: "destructive"
        });
      }
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterVolunteer('all');
    setFilterCategory('all');
  };

  const getStatusBadge = (status: AdminGoal['status']) => {
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

  const getPriorityBadge = (priority: AdminGoal['priority']) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Goals</h1>
            <p className="text-gray-600 mt-1">Monitor all goals across your organization.</p>
          </div>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Goals</h1>
          <p className="text-gray-600 mt-1">Monitor all goals across your organization.</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                <User className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Goals ({filteredGoals.length})</CardTitle>
              <CardDescription>Search and filter goals by status, priority, volunteer, and category</CardDescription>
            </div>
            {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterVolunteer !== 'all' || filterCategory !== 'all') && (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search goals by title, volunteer, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterVolunteer} onValueChange={setFilterVolunteer}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Volunteer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volunteers</SelectItem>
                  {volunteers.map(volunteer => (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      {volunteer.name} ({volunteer.goalsCount} goals)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{goal.title}</p>
                          <p className="text-xs text-gray-400">
                            Created {formatDate(goal.createdDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{goal.volunteerName}</p>
                            <p className="text-xs text-gray-500">{goal.volunteerEmail}</p>
                          </div>
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
                          isOverdue(goal.dueDate, goal.status)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }`}>
                          {formatDate(goal.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{goal.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(goal.id, 'in-progress')}
                              disabled={goal.status === 'in-progress'}
                            >
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(goal.id, 'completed')}
                              disabled={goal.status === 'completed'}
                            >
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePriorityChange(goal.id, 'High')}>
                              Set High Priority
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange(goal.id, 'Medium')}>
                              Set Medium Priority
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange(goal.id, 'Low')}>
                              Set Low Priority
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGoal(goal.id, goal.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Goal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No goals found matching your criteria.</p>
                        {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterVolunteer !== 'all' || filterCategory !== 'all') && (
                          <Button variant="outline" onClick={clearAllFilters} className="mt-2">
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;