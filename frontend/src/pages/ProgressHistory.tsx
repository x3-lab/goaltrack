import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, RefreshCw, BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
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
  const [activeView, setActiveView] = useState<'history' | 'summary'>('history');

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
    toast({
      title: "Data Refreshed",
      description: "Your progress history has been updated.",
    });
  };

  return (
    <VolunteerLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Progress History</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.name && `${user.name}'s `}comprehensive goal tracking and progress analysis
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/volunteer-dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your progress history...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="text-red-600 text-lg font-medium mb-2">Unable to Load Progress History</div>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={loadProgressHistory} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-8">
              {/* Navigation Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    {[
                      { key: 'history', label: 'Detailed History', icon: Calendar },
                      { key: 'summary', label: 'Weekly Summary', icon: BarChart3 }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveView(tab.key as any)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
                          activeView === tab.key
                            ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
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
                </div>
              </div>

              {/* No Data State */}
              {!weeklyHistory && !loading && !error && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Progress History Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start creating and tracking goals to see your comprehensive progress history here. 
                    Your journey begins with your first goal!
                  </p>
                  <Button 
                    onClick={() => navigate('/volunteer-dashboard/goals')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </VolunteerLayout>
  );
};

export default ProgressHistoryPage;