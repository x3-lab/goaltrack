
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import PersonalAnalytics from '../components/PersonalAnalytics';

const PersonalAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock analytics data
  const analyticsData = {
    overallCompletionRate: 85,
    performanceScore: 92,
    streakCount: 4,
    weeklyTrends: [
      { week: 'Jan 1', completionRate: 60, goalsCompleted: 3, totalGoals: 5 },
      { week: 'Jan 8', completionRate: 75, goalsCompleted: 3, totalGoals: 4 },
      { week: 'Jan 15', completionRate: 100, goalsCompleted: 2, totalGoals: 2 },
      { week: 'Jan 22', completionRate: 90, goalsCompleted: 9, totalGoals: 10 },
      { week: 'Jan 29', completionRate: 85, goalsCompleted: 6, totalGoals: 7 },
      { week: 'Feb 5', completionRate: 95, goalsCompleted: 4, totalGoals: 4 },
    ],
    achievements: [
      {
        id: '1',
        title: 'Perfect Week',
        description: 'Completed 100% of goals in a week',
        earnedDate: '2024-01-21',
        icon: '🏆',
      },
      {
        id: '2',
        title: 'Streak Master',
        description: 'Maintained 4-week completion streak',
        earnedDate: '2024-01-28',
        icon: '🔥',
      },
      {
        id: '3',
        title: 'Early Bird',
        description: 'Completed goals before deadline 10 times',
        earnedDate: '2024-01-25',
        icon: '🌅',
      },
      {
        id: '4',
        title: 'Team Player',
        description: 'Participated in 5 team activities',
        earnedDate: '2024-01-20',
        icon: '👥',
      },
    ],
    categoryStats: [
      { category: 'Training & Development', completionRate: 95, totalGoals: 8 },
      { category: 'Community Service', completionRate: 88, totalGoals: 12 },
      { category: 'Team Activities', completionRate: 75, totalGoals: 6 },
      { category: 'Personal Development', completionRate: 70, totalGoals: 4 },
    ],
    productiveData: [
      { day: 'Mon', completedGoals: 3 },
      { day: 'Tue', completedGoals: 5 },
      { day: 'Wed', completedGoals: 4 },
      { day: 'Thu', completedGoals: 6 },
      { day: 'Fri', completedGoals: 2 },
      { day: 'Sat', completedGoals: 8 },
      { day: 'Sun', completedGoals: 1 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
      </div>

      <PersonalAnalytics data={analyticsData} />
    </div>
  );
};

export default PersonalAnalyticsPage;