
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SkeletonGoalCard } from '../components/ui/skeleton-loader';
import { EnhancedGoalForm } from '../components/enhanced-goal-form';
import { DragDropGoals } from '../components/drag-drop-goals';
import { Plus, Target, TrendingUp, Calendar, Award } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  category: string;
  tags: string[];
  dueDate?: string;
}

const VolunteerDashboard: React.FC = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const loadGoals = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGoals([
        {
          id: '1',
          title: 'Complete First Aid Training',
          description: 'Attend the mandatory first aid training session and pass the certification exam',
          priority: 'High',
          status: 'in-progress',
          progress: 75,
          category: 'Training & Development',
          tags: ['training', 'certification', 'safety'],
          dueDate: '2024-07-15'
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
          dueDate: '2024-07-31'
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
          dueDate: '2024-08-10'
        }
      ]);
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
      progress: 0
    };
    
    setGoals(prev => [...prev, newGoal]);
    setShowGoalForm(false);
    
    toast({
      title: "Goal Created",
      description: `"${goalData.title}" has been added to your goals`,
    });
  };

  const handleReorderGoals = (reorderedGoals: Goal[]) => {
    setGoals(reorderedGoals);
    toast({
      title: "Goals Reordered",
      description: "Your goals have been reordered successfully",
    });
  };

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
          onClick={() => setShowGoalForm(true)}
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

      {/* Goal Creation Form */}
      {showGoalForm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Create New Goal</h2>
            <Button 
              variant="outline" 
              onClick={() => setShowGoalForm(false)}
            >
              Cancel
            </Button>
          </div>
          <EnhancedGoalForm onSubmit={handleCreateGoal} />
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Goals</h2>
          <Badge variant="secondary">
            {goals.length} total goals
          </Badge>
        </div>
        
        <DragDropGoals 
          goals={goals}
          onReorder={handleReorderGoals}
        />
      </div>
    </div>
  );
};

export default VolunteerDashboard;