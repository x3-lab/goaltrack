
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api, type PersonalAnalyticsData } from '../services/api';
import PersonalAnalytics from '../components/PersonalAnalytics';

const PersonalAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<PersonalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data from API
  useEffect(() => {
    loadAnalyticsData();
  }, [user?.id]);

  const loadAnalyticsData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await api.analytics.getPersonalAnalytics({ 
        volunteerId: user.id 
      });
      
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
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
        <Button onClick={loadAnalyticsData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No analytics data available</p>
        <Button onClick={loadAnalyticsData} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
          <p className="text-gray-600 mt-1">
            View your performance metrics and track your progress over time.
          </p>
        </div>
        <Button onClick={loadAnalyticsData} variant="outline">
          Refresh
        </Button>
      </div>

      <PersonalAnalytics 
        data={analyticsData} 
        onRefresh={loadAnalyticsData}
        volunteerId={user?.id}
      />
    </div>
  );
};

export default PersonalAnalyticsPage;