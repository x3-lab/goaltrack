import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { goalsApi } from '../services/goalsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { GoalFormModal } from '@/components/GoalFormModal';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Filter,
  BarChart3,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
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
import type { Goal, GoalStatistics } from '../types/api';

interface VolunteerDashboardState {
  goals: Goal[];
  stats: GoalStatistics | null;
  loading: boolean;
  refreshing: boolean;
}

const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [state, setState] = useState<VolunteerDashboardState>({
    goals: [],
    stats: null,
    loading: true,
    refreshing: false,
  });

  // UI State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Load goals and statistics in parallel
      const [goalsData, statsData] = await Promise.all([
        goalsApi.getMyGoals(),
        goalsApi.getStatistics(user.id)
      ]);

      setState(prev => ({
        ...prev,
        goals: goalsData,
        stats: statsData,
        loading: false,
      }));

      console.log(`✅ Loaded ${goalsData.length} goals for volunteer`);
    } catch (error: any) {
      console.error('Error loading volunteer dashboard:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load your dashboard. Please try again.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshData = async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await loadDashboardData();
    setState(prev => ({ ...prev, refreshing: false }));
  };

  const handleCreateGoal = async (goalData: any) => {
    try {
      await goalsApi.create({
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority.toLowerCase() as 'low' | 'medium' | 'high',
        dueDate: goalData.dueDate,
        volunteerId: user?.id,
        tags: goalData.tags || [],
      });

      setShowGoalModal(false);
      await refreshData();
      
      toast({
        title: "Goal Created",
        description: `"${goalData.title}" has been added to your goals`,
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

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      await goalsApi.update(goalId, {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        priority: updates.priority,
        status: updates.status,
        dueDate: updates.dueDate,
        tags: updates.tags,
        notes: updates.notes,
      });

      setEditingGoal(null);
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

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await goalsApi.delete(goalId);
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
      await goalsApi.update(goalId, { 
        status: 'completed',
        progress: 100 
      });
      await refreshData();

      toast({
        title: "Goal Completed! 🎉",
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

  // Filter goals based on current filters
  const filteredGoals = state.goals.filter(goal => {
    if (statusFilter !== 'all' && goal.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && goal.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock, className: ''},
      in_progress: { label: 'In Progress', variant: 'default' as const, icon: TrendingUp, className: '' },
      completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: AlertCircle, className: '' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Low', className: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', className: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress and manage your goals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={refreshData} 
            variant="outline" 
            disabled={state.refreshing}
            className="gap-2"
          >
            {state.refreshing ? <LoadingSpinner size="sm" /> : <BarChart3 className="h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={() => setShowGoalModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {state.stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{state.stats.totalGoals}</p>
                  <p className="text-sm text-muted-foreground">Total Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{state.stats.completedGoals}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{Math.round(state.stats.averageProgress)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{state.stats.overdueGoals}</p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Goals</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="secondary">
              {filteredGoals.length} goals
            </Badge>
          </div>
        </div>
        
        <div className="grid gap-4">
          {filteredGoals.length > 0 ? filteredGoals.map(goal => (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col">
                  <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {goal.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(goal.status)}
                  {getPriorityBadge(goal.priority)}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingGoal(goal)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Goal
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 10), 'Progress update')}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Update Progress
                      </DropdownMenuItem>
                      {goal.status !== 'completed' && (
                        <DropdownMenuItem onClick={() => handleMarkComplete(goal.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteGoal(goal.id, goal.title)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{goal.description}</p>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
                
                {/* Due Date */}
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {formatDate(goal.dueDate)}</span>
                  {new Date(goal.dueDate) < new Date() && goal.status !== 'completed' && (
                    <Badge variant="destructive" className="ml-2">Overdue</Badge>
                  )}
                </div>

                {/* Category */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{goal.category}</Badge>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-12 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No goals found</p>
              <p className="text-sm">
                {statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'Try adjusting your filters or create a new goal.'
                  : 'Create your first goal to get started on your journey!'}
              </p>
              <Button 
                onClick={() => setShowGoalModal(true)} 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Goal Creation/Edit Modal */}
      <GoalFormModal
        isOpen={showGoalModal || !!editingGoal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        onSubmit={editingGoal ? 
          (data) => handleUpdateGoal(editingGoal.id, data) : 
          handleCreateGoal
        }
        initialData={editingGoal || undefined}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
      />
    </div>
  );
};

export default VolunteerDashboard;