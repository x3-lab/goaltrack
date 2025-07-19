import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SkeletonGoalCard } from '../components/ui/skeleton-loader';
import { GoalFormModal } from '../components/GoalFormModal';
import { GoalCard } from '../components/GoalCard';
import { Plus, Target, TrendingUp, Calendar, Award, Filter } from 'lucide-react';
import { Goal, ProgressEntry } from '@/types/goal';

const VolunteerDashboard: React.FC = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'overdue'>('all');

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const loadGoals = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Complete First Aid Training',
          description: 'Attend the mandatory first aid training session and pass the certification exam',
          priority: 'High',
          status: 'in-progress',
          progress: 75,
          category: 'Training & Development',
          tags: ['training', 'certification', 'safety'],
          dueDate: '2024-07-15',
          createdAt: '2024-06-15T10:00:00Z',
          updatedAt: '2024-07-10T14:30:00Z',
          notes: 'Completed online modules, need to attend practical session',
          progressHistory: [
            {
              id: '1',
              timestamp: '2024-06-20T10:00:00Z',
              progress: 25,
              notes: 'Started online training modules'
            },
            {
              id: '2',
              timestamp: '2024-06-25T15:30:00Z',
              progress: 50,
              notes: 'Completed theoretical section'
            },
            {
              id: '3',
              timestamp: '2024-07-10T14:30:00Z',
              progress: 75,
              notes: 'Finished online modules, scheduled practical session'
            }
          ]
        },
        {
          id: '2',
          title: 'Volunteer 20 Hours This Month',
          description: 'Complete 20 hours of volunteer work across various community service projects',
          priority: 'Medium',
          status: 'in-progress',
          progress: 60,
          category: 'Community Service',
          tags: ['community', 'service', 'hours'],
          dueDate: '2024-07-31',
          createdAt: '2024-07-01T09:00:00Z',
          updatedAt: '2024-07-12T16:00:00Z',
          notes: 'Completed 12 hours so far, 8 more to go',
          progressHistory: [
            {
              id: '4',
              timestamp: '2024-07-05T18:00:00Z',
              progress: 20,
              notes: 'Completed 4 hours at food bank'
            },
            {
              id: '5',
              timestamp: '2024-07-12T16:00:00Z',
              progress: 60,
              notes: 'Additional 8 hours at community center'
            }
          ]
        },
        {
          id: '3',
          title: 'Organize Community Event',
          description: 'Plan and execute a community outreach event for local families',
          priority: 'Low',
          status: 'pending',
          progress: 10,
          category: 'Event Planning',
          tags: ['event', 'community', 'outreach'],
          dueDate: '2024-08-10',
          createdAt: '2024-07-08T11:00:00Z',
          updatedAt: '2024-07-08T11:00:00Z',
          notes: 'Initial planning phase',
          progressHistory: [
            {
              id: '6',
              timestamp: '2024-07-08T11:00:00Z',
              progress: 10,
              notes: 'Created initial event outline'
            }
          ]
        }
      ];
      
      setGoals(mockGoals);
      setLoading(false);
    };

    loadGoals();
  }, []);

  const handleCreateGoal = async (goalData: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      ...goalData,
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressHistory: []
    };
    
    setGoals(prev => [...prev, newGoal]);
    
    toast({
      title: "Goal Created",
      description: `"${goalData.title}" has been added to your goals`,
    });
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    ));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    toast({
      title: "Goal Deleted",
      description: "Goal has been removed from your list",
    });
  };

  const handleProgressUpdate = (goalId: string, progress: number, notes: string) => {
    const newProgressEntry: ProgressEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      progress,
      notes
    };

    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { 
            ...goal, 
            progress,
            progressHistory: [...goal.progressHistory, newProgressEntry],
            updatedAt: new Date().toISOString()
          }
        : goal
    ));

    toast({
      title: "Progress Updated",
      description: `Progress set to ${progress}%`,
    });
  };

  const filteredGoals = goals.filter(goal => {
    if (statusFilter === 'all') return true;
    return goal.status === statusFilter;
  });

  const completionRate = goals.length > 0 
    ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100)
    : 0;

  const averageProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonGoalCard key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonGoalCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your goals and make an impact in your community.</p>
        </div>
        <Button 
          onClick={() => setShowGoalModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.filter(g => g.status !== 'completed').length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter(g => g.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress}%</div>
            <Progress value={averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter(g => {
                if (!g.dueDate) return false;
                const dueDate = new Date(g.dueDate);
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                return dueDate <= nextWeek && g.status !== 'completed';
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">goals need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Goals</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Goals</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
            <Badge variant="secondary">
              {filteredGoals.length} goals
            </Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </div>
        
        {filteredGoals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No goals found. Create your first goal to get started!</p>
          </div>
        )}
      </div>

      {/* Goal Creation Modal */}
      <GoalFormModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSubmit={handleCreateGoal}
      />
    </div>
  );
};

export default VolunteerDashboard;