import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Download, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { progressHistoryApi, type VolunteerWeeklyHistoryDto } from '../services/progressHistoryApi';
import ProgressHistory from '../components/ProgressHistory';
import WeeklyProgressSummary from '../components/WeeklyProgressSummary';
import VolunteerLayout from '../components/VolunteerLayout';

const ProgressHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [weeklyHistory, setWeeklyHistory] = useState<VolunteerWeeklyHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'history' | 'summary' | 'analytics'>('history');

  // Load progress history data from API
  useEffect(() => {
    loadProgressHistory();
  }, [user?.id]);

  const loadProgressHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading progress history page data...');
      
      const progressData = await progressHistoryApi.getVolunteerWeeklyHistory(user.id);
      setWeeklyHistory(progressData);
      
      console.log('Progress history page loaded successfully');
      
    } catch (err: any) {
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgressHistory();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      console.log('Exporting progress history...');
      
      // Create export data
      const exportData = {
        volunteer: {
          id: user?.id,
          name: user?.name,
          email: user?.email
        },
        exportDate: new Date().toISOString(),
        weeklyHistory: weeklyHistory,
        summary: {
          totalWeeks: weeklyHistory?.totalWeeks || 0,
          totalGoals: weeklyHistory?.overallStats.totalGoals || 0,
          completedGoals: weeklyHistory?.overallStats.completedGoals || 0,
          averageProgress: weeklyHistory?.overallStats.averageProgress || 0,
          averageCompletionRate: weeklyHistory?.overallStats.averageCompletionRate || 0
        }
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-history-${user?.name?.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete!",
        description: "Your progress history has been downloaded.",
      });
      
    } catch (error: any) {
      console.error('Error exporting progress history:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export progress history. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <VolunteerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg">Loading your progress history...</p>
          </div>
        </div>
      </VolunteerLayout>
    );
  }

  if (error && !weeklyHistory) {
    return (
      <VolunteerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <TrendingUp className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading History</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </VolunteerLayout>
    );
  }

  return (
    <VolunteerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Progress History</h1>
            <p className="text-gray-600">
              {user?.name && `${user.name}'s `}
              comprehensive goal tracking and progress analysis
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {[
              { key: 'history', label: 'Detailed History', icon: Calendar },
              { key: 'summary', label: 'Weekly Summary', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeView === 'history' && (
          <ProgressHistory 
            volunteerId={user?.id}
            onRefresh={handleRefresh}
            showAnalytics={true}
          />
        )}

        {activeView === 'summary' && (
          <WeeklyProgressSummary 
            volunteerId={user?.id}
            showSubmitButton={false}
          />
        )}

        {/* No Data State */}
        {!weeklyHistory && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress History</h3>
              <p className="text-gray-600 mb-4">
                Start creating and tracking goals to see your progress history here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </VolunteerLayout>
  );
};

export default ProgressHistoryPage;