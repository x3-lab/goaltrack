
import React from 'react';
import { Calendar, Target, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface Goal {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  priority: 'High' | 'Medium' | 'Low';
}

interface WeeklyProgressSummaryProps {
  goals: Goal[];
  weekStart: string;
  weekEnd: string;
  onSubmitWeeklyReport: () => void;
}

const WeeklyProgressSummary: React.FC<WeeklyProgressSummaryProps> = ({
  goals,
  weekStart,
  weekEnd,
  onSubmitWeeklyReport,
}) => {
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const inProgressGoals = goals.filter(goal => goal.status === 'in-progress');
  const pendingGoals = goals.filter(goal => goal.status === 'pending');
  
  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;
  
  const completionRate = goals.length > 0 
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0;

  const allGoalsUpdated = goals.every(goal => goal.progress > 0 || goal.status === 'completed');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-200 bg-red-50';
      case 'Medium': return 'border-yellow-200 bg-yellow-50';
      case 'Low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Progress Summary
        </CardTitle>
        <p className="text-sm text-gray-600">
          Week of {new Date(weekStart).toLocaleDateString()} - {new Date(weekEnd).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{goals.length}</div>
            <div className="text-sm text-blue-700">Total Goals</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{overallProgress}%</div>
            <div className="text-sm text-purple-700">Avg Progress</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{completionRate}%</div>
            <div className="text-sm text-indigo-700">Completion Rate</div>
          </div>
        </div>

        {/* Progress Overview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Progress Overview</h4>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{overallProgress}% Complete</span>
            <span>100%</span>
          </div>
        </div>

        {/* Goals Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Goals Breakdown</h4>
          {goals.map((goal) => (
            <div key={goal.id} className={`p-3 border rounded-lg ${getPriorityColor(goal.priority)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(goal.status)}
                  <span className="font-medium text-sm">{goal.title}</span>
                </div>
                <span className="text-sm font-medium">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          ))}
        </div>

        {/* Submit Weekly Report */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {allGoalsUpdated ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  All goals have progress updates
                </span>
              ) : (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Some goals need progress updates
                </span>
              )}
            </div>
            <Button
              onClick={onSubmitWeeklyReport}
              disabled={!allGoalsUpdated}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Submit Weekly Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyProgressSummary;