import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Plus, Target, Calendar, Clock, TrendingUp, 
  AlertCircle, CheckCircle, Eye, Edit, Trash2, Play, Pause,
  MoreHorizontal, Award, BookOpen, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import VolunteerLayout from '../components/VolunteerLayout';
import { EnhancedGoalForm } from '../components/enhanced-goal-form';
import PersonalAnalytics from '../components/PersonalAnalytics';
import ProgressUpdate from '../components/ProgressUpdate';
import { goalsApi, type GoalResponseDto } from '../services/goalsApi';
import { analyticsApi } from '../services/analyticsApi';
import { type PersonalAnalyticsDto } from '../types/analytics';
import { type Goal } from '../types/api';

interface VolunteerGoalsState {
  goals: Goal[];
  analytics: PersonalAnalyticsDto | null;
  categories: string[];
  loading: boolean;
  refreshing: boolean;
  viewingGoal: Goal | null;
  editingGoal: Goal | null;
  progressGoal: Goal | null;
}

const VolunteerGoals: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [state, setState] = useState<VolunteerGoalsState>({
    goals: [],
    analytics: null,
    categories: [],
    loading: true,
    refreshing: false,
    viewingGoal: null,
    editingGoal: null,
    progressGoal: null
  });
  
  // Filters and UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'goals' | 'analytics'>('goals');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load goals and analytics data
  const loadGoalsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      

      const filters = {
        status: filterStatus === 'all' ? undefined : filterStatus,
        priority: filterPriority === 'all' ? undefined : filterPriority,
        category: filterCategory === 'all' ? undefined : filterCategory,
        search: searchTerm || undefined,
      };

      const [goalsData, analyticsData, categoriesData] = await Promise.all([
        goalsApi.getMyGoals(filters),
        analyticsApi.getPersonalAnalytics(user.id).catch(() => null),
        goalsApi.getCategories().catch(() => [])
      ]);

      setState(prev => ({
        ...prev,
        goals: goalsData,
        analytics: analyticsData,
        categories: categoriesData,
        loading: false,
      }));

      console.log(`Loaded ${goalsData.length} goals successfully`);

    } catch (error: any) {
      console.error('Error loading goals data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load goals data",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, searchTerm, filterStatus, filterPriority, filterCategory, toast]);

  // Initial data load
  useEffect(() => {
    loadGoalsData();
  }, [loadGoalsData]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true }));
      await loadGoalsData();
      toast({
        title: "Data Refreshed",
        description: "Your goals have been updated.",
      });
    } catch (error) {
      // Error already handled in loadGoalsData
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle filter change
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
    }
  };

  // Handle goal creation
  const handleCreateGoal = async (goalData: any) => {
    try {
      const newGoalData = {
        ...goalData,
        volunteerId: user?.id
      };
      
      await goalsApi.create(newGoalData);
      setShowCreateModal(false);
      await loadGoalsData();
      
      toast({
        title: "Goal Created!",
        description: "Your new goal has been created successfully.",
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

  // Handle goal update
  const handleUpdateGoal = async (id: string, updates: any) => {
    try {
      await goalsApi.update(id, updates);
      setState(prev => ({ ...prev, editingGoal: null }));
      await loadGoalsData();
      
      toast({
        title: "Goal Updated",
        description: "Your goal has been updated successfully.",
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

  // Handle goal deletion
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
        description: "Your goal has been removed.",
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

  // Handle progress update
  const handleProgressUpdate = async (goalId: string, progress: number, notes?: string) => {
    try {
      await goalsApi.updateProgress(goalId, { progress, notes });
      setState(prev => ({ ...prev, progressGoal: null }));
      await loadGoalsData();

      toast({
        title: "Progress Updated!",
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

  // Handle mark complete
  const handleMarkComplete = async (goalId: string) => {
    try {
      await goalsApi.update(goalId, { 
        status: 'completed',
        progress: 100 
      });
      await loadGoalsData();

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

  // Handle start/pause goal
  const handleToggleGoalStatus = async (goalId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'in-progress' : 'pending';
      await goalsApi.update(goalId, { status: newStatus });
      await loadGoalsData();

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

  // View goal details
  const handleViewGoal = (goal: Goal) => {
    setState(prev => ({ ...prev, viewingGoal: goal }));
  };

  // Edit goal
  const handleEditGoal = (goal: Goal) => {
    setState(prev => ({ ...prev, editingGoal: goal }));
  };

  // Update progress
  const handleUpdateProgress = (goal: Goal) => {
    setState(prev => ({ ...prev, progressGoal: goal }));
  };

  // Filter goals based on current filters
  const filteredGoals = state.goals.filter(goal => {
    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || goal.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
    const matchesSearch = !searchTerm || 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: state.goals.length,
    completed: state.goals.filter(g => g.status === 'completed').length,
    inProgress: state.goals.filter(g => g.status === 'in-progress').length,
    pending: state.goals.filter(g => g.status === 'pending').length,
    overdue: state.goals.filter(g => g.status === 'overdue').length,
    completionRate: state.goals.length > 0 ? 
      Math.round((state.goals.filter(g => g.status === 'completed').length / state.goals.length) * 100) : 0
  };

  // Render status badge
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

  // Render priority badge
  const renderPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  // Get next action for goal
  const getNextAction = (goal: Goal) => {
    if (goal.status === 'completed') return null;
    if (goal.status === 'cancelled') return null;
    if (goal.status === 'overdue') return 'Review';
    if (goal.status === 'pending') return 'Start';
    if (goal.progress >= 100) return 'Complete';
    return 'Update Progress';
  };

  return (
    <VolunteerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Goals</h1>
            <p className="text-muted-foreground">
              Track your progress and achieve your objectives
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
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <h3 className="text-2xl font-bold text-blue-600">{stats.inProgress}</h3>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold text-gray-600">{stats.pending}</h3>
                </div>
                <Calendar className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <h3 className="text-2xl font-bold">{stats.completionRate}%</h3>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <Progress value={stats.completionRate} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'goals' | 'analytics')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="goals">Goals Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search your goals..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                      <SelectTrigger className="w-[140px]">
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
                      <SelectTrigger className="w-[140px]">
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
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {state.categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Goals ({filteredGoals.length})</CardTitle>
                <CardDescription>
                  Manage your personal goals and track progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {state.loading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-lg">Loading your goals...</span>
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' 
                        ? 'No goals match your filters' 
                        : 'No goals yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Create your first goal to get started on your journey!'}
                    </p>
                    {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && filterCategory === 'all' && (
                      <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Your First Goal
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredGoals.map(goal => (
                      <Card key={goal.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{goal.title}</h3>
                                {renderStatusBadge(goal.status)}
                                {renderPriorityBadge(goal.priority)}
                              </div>
                              
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {goal.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="h-4 w-4" />
                                  <span>{goal.category}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <Progress value={goal.progress} className="h-2 flex-1" />
                                <span className="text-sm font-medium">{goal.progress}%</span>
                              </div>
                            </div>
                            
                            <div className="ml-4 flex flex-col gap-2">
                              {/* Quick Action Button */}
                              {getNextAction(goal) && (
                                <Button
                                  size="sm"
                                  variant={goal.status === 'pending' ? 'default' : 'outline'}
                                  onClick={() => {
                                    const action = getNextAction(goal);
                                    if (action === 'Start') {
                                      handleToggleGoalStatus(goal.id, goal.status);
                                    } else if (action === 'Complete') {
                                      handleMarkComplete(goal.id);
                                    } else if (action === 'Update Progress') {
                                      handleUpdateProgress(goal);
                                    }
                                  }}
                                  className="whitespace-nowrap"
                                >
                                  {getNextAction(goal) === 'Start' && <Play className="h-4 w-4 mr-1" />}
                                  {getNextAction(goal) === 'Complete' && <CheckCircle className="h-4 w-4 mr-1" />}
                                  {getNextAction(goal) === 'Update Progress' && <TrendingUp className="h-4 w-4 mr-1" />}
                                  {getNextAction(goal)}
                                </Button>
                              )}
                              
                              {/* More Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewGoal(goal)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Goal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateProgress(goal)}>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Update Progress
                                  </DropdownMenuItem>
                                  {goal.status === 'in-progress' && (
                                    <DropdownMenuItem onClick={() => handleToggleGoalStatus(goal.id, goal.status)}>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause Goal
                                    </DropdownMenuItem>
                                  )}
                                  {goal.status === 'pending' && (
                                    <DropdownMenuItem onClick={() => handleToggleGoalStatus(goal.id, goal.status)}>
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Goal
                                    </DropdownMenuItem>
                                  )}
                                  {goal.progress >= 100 && goal.status !== 'completed' && (
                                    <DropdownMenuItem onClick={() => handleMarkComplete(goal.id)}>
                                      <Award className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Goal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <PersonalAnalytics
              volunteerId={user?.id}
              analytics={state.analytics}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a new personal goal and start your journey towards achievement
            </DialogDescription>
          </DialogHeader>
          <EnhancedGoalForm 
            onSubmit={handleCreateGoal}
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
              Update your goal details and adjust your plan
            </DialogDescription>
          </DialogHeader>
          {state.editingGoal && (
            <EnhancedGoalForm 
              goal={state.editingGoal}
              onSubmit={(data) => handleUpdateGoal(state.editingGoal!.id, data)}
              categories={state.categories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={!!state.progressGoal} onOpenChange={(open) => !open && setState(prev => ({ ...prev, progressGoal: null }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Track your progress on "{state.progressGoal?.title}"
            </DialogDescription>
          </DialogHeader>
          {state.progressGoal && (
            <ProgressUpdate
              goal={state.progressGoal}
              onUpdate={(progress, notes) => handleProgressUpdate(state.progressGoal!.id, progress, notes)}
              onCancel={() => setState(prev => ({ ...prev, progressGoal: null }))}
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
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{state.viewingGoal.title}</h3>
                  <div className="flex gap-2">
                    {renderStatusBadge(state.viewingGoal.status)}
                    {renderPriorityBadge(state.viewingGoal.priority)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-muted-foreground">{state.viewingGoal.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <p className="text-muted-foreground">{state.viewingGoal.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Due Date</h4>
                    <p className="text-muted-foreground">
                      {new Date(state.viewingGoal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Progress</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={state.viewingGoal.progress} className="h-2 flex-1" />
                    <span className="font-medium">{state.viewingGoal.progress}%</span>
                  </div>
                </div>
                
                {state.viewingGoal.tags && state.viewingGoal.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {state.viewingGoal.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {state.viewingGoal.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{state.viewingGoal.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4 border-t">
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
    </VolunteerLayout>
  );
};

export default VolunteerGoals;