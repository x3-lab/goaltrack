import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { goalsApi, type GoalResponseDto, type GoalFilterDto } from '../services/goalsApi';
import { usersApi } from '../services/usersApi';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Progress } from '../components/ui/progress';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Target,
  AlertCircle, 
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
} from 'lucide-react';
import type { Goal, GoalStatistics } from '../types/api';
import type { Volunteer } from '../services/usersApi';

interface GoalsPageState {
  goals: GoalResponseDto[];
  stats: GoalStatistics | null;
  volunteers: Volunteer[];
  categories: string[];
  loading: boolean;
  refreshing: boolean;
  selectedGoals: string[];
}

const Goals: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<GoalsPageState>({
    goals: [],
    stats: null,
    volunteers: [],
    categories: [],
    loading: true,
    refreshing: false,
    selectedGoals: [],
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterVolunteer, setFilterVolunteer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // Load data on component mount and filter changes
  useEffect(() => {
    loadGoalsData();
  }, [searchTerm, filterStatus, filterPriority, filterCategory, filterVolunteer, sortBy, sortOrder, currentPage]);

  const loadGoalsData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const filters: GoalFilterDto = {
        search: searchTerm || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
        priority: filterPriority === 'all' ? undefined : filterPriority,
        category: filterCategory === 'all' ? undefined : filterCategory,
        volunteerId: filterVolunteer === 'all' ? undefined : filterVolunteer,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage,
      };

      const [goalsResponse, statsData, volunteersData, categoriesData] = await Promise.all([
        goalsApi.list(filters),
        goalsApi.getStatistics(),
        usersApi.getAll({ role: 'volunteer' }),
        goalsApi.getCategories().catch(() => [])
      ]);
      
      setState(prev => ({
        ...prev,
        goals: goalsResponse.goals,
        stats: statsData,
        volunteers: volunteersData,
        categories: categoriesData,
        loading: false,
      }));
      
      setTotalPages(goalsResponse.totalPages);
      setTotalItems(goalsResponse.total);
    } catch (error: any) {
      console.error('Error loading goals data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load goals data",
        variant: "destructive"
      });
    }
  }, [searchTerm, filterStatus, filterPriority, filterCategory, filterVolunteer, sortBy, sortOrder, currentPage, itemsPerPage, toast]);

  const handleRefresh = async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true }));
      await loadGoalsData();
      toast({
        title: "Data Refreshed",
        description: "Goals data has been updated.",
      });
    } catch (error) {
      // Error already handled in loadGoalsData
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'status':
        setFilterStatus(value);
        break;
      case 'priority':
        setFilterPriority(value);
        break;
      case 'category':
        setFilterCategory(value);
        break;
      case 'volunteer':
        setFilterVolunteer(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleSelectGoal = (goalId: string, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedGoals: selected 
        ? [...prev.selectedGoals, goalId]
        : prev.selectedGoals.filter(id => id !== goalId)
    }));
  };

  const handleSelectAll = (selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedGoals: selected ? prev.goals.map(g => g.id) : []
    }));
  };

  const handleBulkAction = async (action: 'delete' | 'status_change', value?: string) => {
    if (state.selectedGoals.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select goals to perform bulk actions",
        variant: "destructive"
      });
      return;
    }

    const actionText = action === 'delete' ? 'delete' : `update status of`;
    const confirmMessage = `Are you sure you want to ${actionText} ${state.selectedGoals.length} goal(s)?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      switch (action) {
        case 'delete':
          await goalsApi.bulkDelete(state.selectedGoals);
          toast({
            title: "Success",
            description: `${state.selectedGoals.length} goals deleted`,
          });
          break;
        case 'status_change':
          if (value) {
            await goalsApi.bulkUpdate({
              goalIds: state.selectedGoals,
              updates: { status: value as any }
            });
            toast({
              title: "Success",
              description: `${state.selectedGoals.length} goals updated`,
            });
          }
          break;
      }
      
      setState(prev => ({ ...prev, selectedGoals: [] }));
      await loadGoalsData();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const confirmMessage = `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await goalsApi.delete(goalId);
      await loadGoalsData();
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
    } catch (error: any) {
      console.error('Delete goal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive"
      });
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const filters: GoalFilterDto = {
        search: searchTerm || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
        priority: filterPriority === 'all' ? undefined : filterPriority,
        category: filterCategory === 'all' ? undefined : filterCategory,
        volunteerId: filterVolunteer === 'all' ? undefined : filterVolunteer,
      };

      const blob = await goalsApi.exportGoals(format, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `goals-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Goals exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export goals",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'bg-gray-100 text-gray-800' },
      'in-progress': { variant: 'default' as const, icon: Target, color: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      overdue: { variant: 'destructive' as const, icon: AlertCircle, color: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle, color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', '-')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium}>
        {priority}
      </Badge>
    );
  };

  const getVolunteerName = (volunteerId: string) => {
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    return volunteer?.name || 'Unknown';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Goals Management</h1>
            <p className="text-muted-foreground">
              Create, assign, and track goals for volunteers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={state.refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${state.refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Goal
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {state.stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{state.stats.totalGoals}</p>
                  <p className="text-sm text-gray-600">Total Goals</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{state.stats.completedGoals}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{state.stats.inProgressGoals}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{state.stats.overdueGoals}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search goals by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {state.categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterVolunteer} onValueChange={(value) => handleFilterChange('volunteer', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Volunteers</SelectItem>
                    {state.volunteers.map(volunteer => (
                      <SelectItem key={volunteer.id} value={volunteer.id}>{volunteer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {state.selectedGoals.length > 0 && (
              <div className="flex items-center gap-2 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {state.selectedGoals.length} goal(s) selected
                </span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Update Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('status_change', 'pending')}>
                        Set to Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('status_change', 'in-progress')}>
                        Set to In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('status_change', 'completed')}>
                        Set to Completed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Goals Table */}
        <Card>
          <CardContent className="p-0">
            {state.loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-2 text-muted-foreground">Loading goals...</span>
              </div>
            ) : state.goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No goals found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' || filterVolunteer !== 'all' 
                    ? 'No goals match your current filters.' 
                    : 'Get started by creating your first goal.'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && filterCategory === 'all' && filterVolunteer === 'all' && (
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Goal
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={state.selectedGoals.length === state.goals.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('title')}
                    >
                      Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.goals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <Checkbox
                          checked={state.selectedGoals.includes(goal.id)}
                          onCheckedChange={(checked) => 
                            handleSelectGoal(goal.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{goal.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(goal.status)}</TableCell>
                      <TableCell>{getPriorityBadge(goal.priority)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={goal.progress} className="w-16" />
                          <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getVolunteerName(goal.volunteerId)}</TableCell>
                      <TableCell>{goal.category}</TableCell>
                      <TableCell>{formatDate(goal.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} goals
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Goals;