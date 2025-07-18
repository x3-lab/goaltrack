import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api, type HistoricalWeek } from '../services/api';
import ProgressHistory from '../components/ProgressHistory';

const ProgressHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [historicalData, setHistoricalData] = useState<HistoricalWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress history data from API
  useEffect(() => {
    loadProgressHistory();
  }, [user?.id]);

  const loadProgressHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const progressData = await api.goals.getProgressHistory({ 
        volunteerId: user.id 
      });
      
      setHistoricalData(progressData);
    } catch (err) {
      console.error('Error loading progress history:', err);
      setError('Failed to load progress history');
      toast({
        title: 'Error',
        description: 'Failed to load progress history. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadProgressHistory} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress History</h1>
          <p className="text-gray-600 mt-1">
            View your goal completion history and track your progress over time.
          </p>
        </div>
      </div>

      <ProgressHistory 
        historicalData={historicalData} 
        onRefresh={loadProgressHistory}
        volunteerId={user?.id}
      />
    </div>
  );
};

export default ProgressHistoryPage;