
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProgressHistory from '../components/ProgressHistory';

const ProgressHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock historical data
  const historicalData = [
    {
      weekStart: '2024-01-15',
      weekEnd: '2024-01-21',
      completionRate: 100,
      goals: [
        {
          id: 1,
          title: 'Complete First Aid Training',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
        },
        {
          id: 2,
          title: 'Volunteer 20 Hours',
          status: 'completed' as const,
          progress: 100,
          priority: 'Medium' as const,
        },
      ],
    },
    {
      weekStart: '2024-01-08',
      weekEnd: '2024-01-14',
      completionRate: 75,
      goals: [
        {
          id: 3,
          title: 'Organize Community Event',
          status: 'completed' as const,
          progress: 100,
          priority: 'Low' as const,
        },
        {
          id: 4,
          title: 'Team Meeting Attendance',
          status: 'in-progress' as const,
          progress: 50,
          priority: 'Medium' as const,
        },
      ],
    },
    {
      weekStart: '2024-01-01',
      weekEnd: '2024-01-07',
      completionRate: 60,
      goals: [
        {
          id: 5,
          title: 'Food Bank Assistance',
          status: 'completed' as const,
          progress: 100,
          priority: 'High' as const,
        },
        {
          id: 6,
          title: 'Community Garden Project',
          status: 'pending' as const,
          progress: 20,
          priority: 'Low' as const,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Progress History</h1>
      </div>

      <ProgressHistory historicalData={historicalData} />
    </div>
  );
};

export default ProgressHistoryPage;