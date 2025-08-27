import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, MoreHorizontal, Target, Calendar, User, AlertCircle, 
  CheckCircle, Clock, Eye, Edit, Trash2, Download, RefreshCw, BarChart3,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { EnhancedGoalForm } from '../components/enhanced-goal-form';
import { goalsApi, type GoalResponseDto, type GoalFilterDto } from '../services/goalsApi';
import { usersApi, type Volunteer } from '../services/usersApi';
import { type GoalStatistics } from '../types/api';

interface AdminGoalManagementState {
  goals: GoalResponseDto[];
  stats: GoalStatistics | null;
  volunteers: Volunteer[];
  categories: string[];
  loading: boolean;
  refreshing: boolean;
  selectedGoals: string[];
  viewingGoal: GoalResponseDto | null;
  editingGoal: GoalResponseDto | null;
  processingWeekly: boolean;
  exportingData: boolean;
}

const AdminGoalManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<AdminGoalManagementState>({
    goals: [],
    stats: null,
    volunteers: [],
    categories: [],
    loading: true,
    refreshing: false,
    selectedGoals: [],
    viewingGoal: null,
    editingGoal: null,
    processingWeekly: false,
    exportingData: false
  });
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterVolunteer, setFilterVolunteer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [searchTerm, filterStatus, filterPriority, filterCategory, filterVolunteer, sortBy, sortOrder, currentPage, itemsPerPage, toast]);

  // Initial data load
  useEffect(() => {
    loadGoalsData();
  }, [loadGoalsData]);

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
    setCurrentPage(1); // Reset to first page when searching
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
      selectedGoals: selected ? prev.goals.map(goal => goal.id) : []
    }));
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (state.selectedGoals.length === 0) return;
    
    try {
      switch (action) {
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
        case 'priority_change':
          if (value) {
            await goalsApi.bulkUpdate({
              goalIds: state.selectedGoals,
              updates: { priority: value as any }
            });
            toast({
              title: "Success",
              description: `${state.selectedGoals.length} goals updated`,
            });
          }
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${state.selectedGoals.length} goals? This action cannot be undone.`)) {
            await goalsApi.bulkDelete(state.selectedGoals);
            toast({
              title: "Success",
              description: `${state.selectedGoals.length} goals deleted`,
            });
          } else {
            return;
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

  // Handle goal creation
  const handleCreateGoal = async (goalData: any) => {
    try {
      await goalsApi.create(goalData);
      setShowCreateModal(false);
      await loadGoalsData();
      toast({
        title: "Goal Created",
        description: "New goal has been created successfully",
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

  const handleUpdateGoal = async (id: string, updates: any) => {
    try {
      await goalsApi.update(id, updates);
      setState(prev => ({ ...prev, editingGoal: null }));
      await loadGoalsData();
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
        title: "Goal Deleted",
        description: "Goal has been deleted successfully",
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

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      setState(prev => ({ ...prev, exportingData: true }));
      
      const filters: GoalFilterDto = {
        search: searchTerm || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
        priority: filterPriority === 'all' ? undefined : filterPriority,
        category: filterCategory === 'all' ? undefined : filterCategory,
        volunteerId: filterVolunteer === 'all' ? undefined : filterVolunteer,
      };
      
      const blob = await goalsApi.exportGoals(format, filters);
      
      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goals-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Goals data has been exported in ${format.toUpperCase()} format`,
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export goals data",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, exportingData: false }));
    }
  };

  const handleProcessWeeklyGoals = async () => {
    try {
      setState(prev => ({ ...prev, processingWeekly: true }));
      
      const result = await goalsApi.processWeeklyGoals();
      
      await loadGoalsData();
      
      toast({
        title: "Weekly Processing Complete",
        description: `Processed ${result.processedGoals} goals, ${result.overdueGoals} marked as overdue`,
      });
    } catch (error: any) {
      console.error('Error processing weekly goals:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process weekly goals",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, processingWeekly: false }));
    }
  };

  // View goal details
  const handleViewGoal = (goal: GoalResponseDto) => {
    setState(prev => ({ ...prev, viewingGoal: goal }));
  };

  const handleEditGoal = (goal: GoalResponseDto) => {
    setState(prev => ({ ...prev, editingGoal: goal }));
  };

  const getVolunteerName = (volunteerId: string) => {
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    return volunteer?.name || 'Unknown';
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      overdue: 'bg-amber-100 text-amber-800',
    };

    return (
      <Badge className={statusConfig[status] || statusConfig.pending}>
        {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, string> = {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Goals Management</h1>
            <p className="text-muted-foreground">
              Create, assign, and track goals for volunteers
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={state.refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${state.refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Goal
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {state.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <h3 className="text-2xl font-bold">{state.stats.totalGoals}</h3>
                    <p className="text-xs text-muted-foreground">goals</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Complete</p>
                    <h3 className="text-2xl font-bold">{state.stats.completionRate}%</h3>
                    <p className="text-xs text-muted-foreground">rate</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={state.stats.completionRate} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                    <h3 className="text-2xl font-bold">{state.stats.overdueGoals}</h3>
                    <p className="text-xs text-muted-foreground">goals</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Progress</p>
                    <h3 className="text-2xl font-bold">{state.stats.inProgressGoals}</h3>
                    <p className="text-xs text-muted-foreground">active</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters & Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search goals by title, description, or volunteer..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {/* Filter Controls */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
              <div className="pt-4 border-t mt-4 space-y-3">
                <div className="text-sm text-muted-foreground">
                  {state.selectedGoals.length} goal(s) selected
                </div>
                <div className="flex flex-wrap gap-2">
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
                        Mark as Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('status_change', 'cancelled')}>
                        Cancel Goals
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Update Priority
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('priority_change', 'high')}>
                        Set to High
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('priority_change', 'medium')}>
                        Set to Medium
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('priority_change', 'low')}>
                        Set to Low
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Goals</CardTitle>
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
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
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleProcessWeeklyGoals}
                  disabled={state.processingWeekly}
                >
                  {state.processingWeekly ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Process Weekly</span>
                  <span className="sm:hidden">Weekly</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-lg">Loading goals...</span>
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
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Goal
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left w-12">
                          <Checkbox 
                            checked={state.selectedGoals.length === state.goals.length && state.goals.length > 0} 
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th 
                          className="py-3 px-2 text-left font-medium cursor-pointer"
                          onClick={() => handleSort('title')}
                        >
                          <div className="flex items-center">
                            Title
                            {sortBy === 'title' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-2 text-left font-medium">Status</th>
                        <th className="py-3 px-2 text-left font-medium">Priority</th>
                        <th className="py-3 px-2 text-left font-medium">Category</th>
                        <th className="py-3 px-2 text-left font-medium">Progress</th>
                        <th 
                          className="py-3 px-2 text-left font-medium cursor-pointer"
                          onClick={() => handleSort('dueDate')}
                        >
                          <div className="flex items-center">
                            Due Date
                            {sortBy === 'dueDate' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-2 text-left font-medium cursor-pointer"
                          onClick={() => handleSort('volunteerId')}
                        >
                          <div className="flex items-center">
                            Volunteer
                            {sortBy === 'volunteerId' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.goals.map(goal => (
                        <tr key={goal.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <Checkbox 
                              checked={state.selectedGoals.includes(goal.id)} 
                              onCheckedChange={(checked) => handleSelectGoal(goal.id, !!checked)}
                            />
                          </td>
                          <td className="py-3 px-2 font-medium">
                            <div className="max-w-[200px] truncate">{goal.title}</div>
                          </td>
                          <td className="py-3 px-2">
                            {renderStatusBadge(goal.status)}
                          </td>
                          <td className="py-3 px-2">
                            {renderPriorityBadge(goal.priority)}
                          </td>
                          <td className="py-3 px-2">
                            <div className="max-w-[150px] truncate">{goal.category}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Progress value={goal.progress} className="h-2 w-24" />
                              <span className="text-sm">{goal.progress}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(goal.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="max-w-[150px] truncate">
                                {getVolunteerName(goal.volunteerId)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleViewGoal(goal)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Goal</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {state.goals.map(goal => (
                    <Card key={goal.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox 
                              checked={state.selectedGoals.includes(goal.id)} 
                              onCheckedChange={(checked) => handleSelectGoal(goal.id, !!checked)}
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-left mb-1">{goal.title}</h3>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {renderStatusBadge(goal.status)}
                                {renderPriorityBadge(goal.priority)}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewGoal(goal)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Goal
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
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Category</span>
                            <span className="text-sm font-medium">{goal.category}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <div className="flex items-center gap-2">
                              <Progress value={goal.progress} className="h-2 w-20" />
                              <span className="text-sm font-medium">{goal.progress}%</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Due Date</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(goal.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Volunteer</span>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {getVolunteerName(goal.volunteerId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
          
          {/* Pagination */}
          {!state.loading && state.goals.length > 0 && totalPages > 1 && (
            <CardFooter>
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} goals
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex items-center gap-1">
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
                  
                  {/* Mobile Pagination - Simple */}
                  <div className="sm:hidden flex items-center gap-2">
                    <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Create a new goal and assign it to a volunteer
            </DialogDescription>
          </DialogHeader>
          <EnhancedGoalForm 
            onSubmit={handleCreateGoal}
            volunteers={state.volunteers}
            categories={state.categories}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!state.editingGoal} onOpenChange={(open) => !open && setState(prev => ({ ...prev, editingGoal: null }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update goal details and track progress
            </DialogDescription>
          </DialogHeader>
          {state.editingGoal && (
            <EnhancedGoalForm 
              goal={state.editingGoal}
              onSubmit={(data) => handleUpdateGoal(state.editingGoal!.id, data)}
              volunteers={state.volunteers}
              categories={state.categories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Goal Dialog */}
      <Dialog open={!!state.viewingGoal} onOpenChange={(open) => !open && setState(prev => ({ ...prev, viewingGoal: null }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Goal Details</DialogTitle>
          </DialogHeader>
          {state.viewingGoal && (
            <div className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Title</Label>
                  <div className="col-span-3 font-medium">{state.viewingGoal.title}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Description</Label>
                  <div className="col-span-3">{state.viewingGoal.description}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3">{renderStatusBadge(state.viewingGoal.status)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Priority</Label>
                  <div className="col-span-3">{renderPriorityBadge(state.viewingGoal.priority)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Category</Label>
                  <div className="col-span-3">{state.viewingGoal.category}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Progress</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Progress value={state.viewingGoal.progress} className="h-2 flex-1" />
                    <span>{state.viewingGoal.progress}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Due Date</Label>
                  <div className="col-span-3">
                    {new Date(state.viewingGoal.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Assigned To</Label>
                  <div className="col-span-3">
                    {getVolunteerName(state.viewingGoal.volunteerId)}
                  </div>
                </div>
                {state.viewingGoal.tags && state.viewingGoal.tags.length > 0 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tags</Label>
                    <div className="col-span-3 flex flex-wrap gap-1">
                      {state.viewingGoal.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {state.viewingGoal.notes && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right">Notes</Label>
                    <div className="col-span-3 whitespace-pre-line">{state.viewingGoal.notes}</div>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setState(prev => ({ ...prev, viewingGoal: null, editingGoal: prev.viewingGoal }));
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="default"
                  onClick={() => setState(prev => ({ ...prev, viewingGoal: null }))}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminGoalManagement;