import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProgressHistory from '../components/ProgressHistory';

const ProgressHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Enhanced mock historical data
  const historicalData = [
    {
      weekStart: '2024-01-15',
      weekEnd: '2024-01-21',
      completionRate: 100,
      totalGoals: 2,
      completedGoals: 2,
      averageProgress: 100,
      goals: [
        {
          id: 1,
          title: 'Complete First Aid Training',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
          category: 'Training & Development',
          notes: 'Passed certification with 95% score',
        },
        {
          id: 2,
          title: 'Volunteer 20 Hours',
          status: 'completed' as const,
          progress: 100,
          priority: 'Medium' as const,
          category: 'Community Service',
          notes: 'Exceeded target with 22 hours',
        },
      ],
    },
    {
      weekStart: '2024-01-08',
      weekEnd: '2024-01-14',
      completionRate: 75,
      totalGoals: 4,
      completedGoals: 3,
      averageProgress: 87,
      goals: [
        {
          id: 3,
          title: 'Organize Community Event',
          status: 'completed' as const,
          progress: 100,
          priority: 'Low' as const,
          category: 'Event Planning',
          notes: 'Successfully organized food drive',
        },
        {
          id: 4,
          title: 'Team Meeting Attendance',
          status: 'in-progress' as const,
          progress: 50,
          priority: 'Medium' as const,
          category: 'Team Activities',
          notes: 'Attended 2 out of 4 meetings',
        },
        {
          id: 5,
          title: 'Safety Training Update',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
          category: 'Training & Development',
          notes: 'Completed annual safety refresher',
        },
        {
          id: 6,
          title: 'Fundraising Campaign',
          status: 'completed' as const,
          progress: 100,
          priority: 'Medium' as const,
          category: 'Fundraising',
          notes: 'Raised $500 for local charity',
        },
      ],
    },
    {
      weekStart: '2024-01-01',
      weekEnd: '2024-01-07',
      completionRate: 60,
      totalGoals: 5,
      completedGoals: 3,
      averageProgress: 72,
      goals: [
        {
          id: 7,
          title: 'Food Bank Assistance',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
          category: 'Community Service',
          notes: 'Helped distribute food to 50 families',
        },
        {
          id: 8,
          title: 'Community Garden Project',
          status: 'pending' as const,
          progress: 20,
          priority: 'Low' as const,
          category: 'Environmental',
          notes: 'Initial planning completed',
        },
        {
          id: 9,
          title: 'Mentor New Volunteer',
          status: 'completed' as const,
          progress: 100,
          priority: 'Medium' as const,
          category: 'Mentoring',
          notes: 'Successfully onboarded Sarah',
        },
        {
          id: 10,
          title: 'Monthly Report Submission',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
          category: 'Administration',
          notes: 'Submitted on time with all metrics',
        },
        {
          id: 11,
          title: 'Skills Workshop Attendance',
          status: 'in-progress' as const,
          progress: 75,
          priority: 'Medium' as const,
          category: 'Training & Development',
          notes: 'Completed 3 out of 4 sessions',
        },
      ],
    },
    {
      weekStart: '2023-12-25',
      weekEnd: '2023-12-31',
      completionRate: 90,
      totalGoals: 3,
      completedGoals: 2,
      averageProgress: 93,
      goals: [
        {
          id: 12,
          title: 'Holiday Food Drive',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
          category: 'Community Service',
          notes: 'Collected 200 cans for families',
        },
        {
          id: 13,
          title: 'Year-End Documentation',
          status: 'completed' as const,
          progress: 100,
          priority: 'Medium' as const,
          category: 'Administration',
          notes: 'All annual reports filed',
        },
        {
          id: 14,
          title: 'Gift Wrapping Event',
          status: 'in-progress' as const,
          progress: 80,
          priority: 'Low' as const,
          category: 'Event Planning',
          notes: 'Wrapped 80 gifts, need 20 more',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {/* <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button> */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress History</h1>
          <p className="text-gray-600 mt-1">
            View your goal completion history and track your progress over time.
          </p>
        </div>
      </div>

      <ProgressHistory historicalData={historicalData} />
    </div>
  );
};

export default ProgressHistoryPage;