import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, TrendingUp, Award, Target, BarChart3, Calendar, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi } from '../services/analyticsApi';
import { progressHistoryApi, type VolunteerTrendsDto, type MostProductiveDayDto } from '../services/progressHistoryApi';
import VolunteerLayout from '../components/VolunteerLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { PersonalAnalyticsDto } from '../types/analytics';

const PersonalAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<PersonalAnalyticsDto | null>(null);
  const [trends, setTrends] = useState<VolunteerTrendsDto | null>(null);
  const [productivityData, setProductivityData] = useState<MostProductiveDayDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Load analytics data from API
  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData();
    }
  }, [user?.id]);

  const loadAnalyticsData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('� Loading comprehensive analytics for user:', user.id);
      
      // Load all data in parallel with proper error handling
      const [analyticsResult, trendsResult, productivityResult] = await Promise.allSettled([
        analyticsApi.getPersonalAnalytics(user.id),
        progressHistoryApi.getVolunteerTrends(user.id),
        progressHistoryApi.getVolunteerMostProductiveDay(user.id)
      ]);
      
      // Handle analytics data (required)
      if (analyticsResult.status === 'fulfilled') {
        setAnalyticsData(analyticsResult.value);
      } else {
        throw new Error('Failed to load personal analytics');
      }
      
      // Handle trends data (optional)
      if (trendsResult.status === 'fulfilled') {
        setTrends(trendsResult.value);
      } else {
        console.warn('Trends data not available:', trendsResult.reason);
      }
      
      // Handle productivity data (optional)  
      if (productivityResult.status === 'fulfilled') {
        setProductivityData(productivityResult.value);
      } else {
        console.warn('Productivity data not available:', productivityResult.reason);
      }
      
      console.log('✅ Analytics data loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Error loading analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
      toast({
        title: 'Error',
        description: 'Failed to load your analytics data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Your analytics have been updated.",
    });
  };

  // Helper functions
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 80) return { level: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 70) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (score >= 60) return { level: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const formatChartData = (data: any[]) => {
    return data.map((item, index) => ({
      ...item,
      fill: chartColors[index % chartColors.length]
    }));
  };

  return (
    <VolunteerLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personal Analytics</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Comprehensive insights into your goal progress and productivity
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
                  Refresh
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your analytics...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="text-red-600 text-lg font-medium mb-2">Unable to Load Analytics</div>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={loadAnalyticsData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && !analyticsData && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <div className="text-gray-600 text-lg font-medium mb-2">No Analytics Data</div>
              <p className="text-gray-500 mb-4">No analytics data is available for your account.</p>
              <Button onClick={loadAnalyticsData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Loading Again
              </Button>
            </div>
          )}

          {!loading && !error && analyticsData && (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Completion Rate */}
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Completion Rate</p>
                        <p className="text-3xl font-bold">{analyticsData.overallCompletionRate}%</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Score */}
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Performance Score</p>
                        <p className="text-3xl font-bold">{analyticsData.performanceScore}</p>
                        <p className="text-green-100 text-xs">
                          {getPerformanceLevel(analyticsData.performanceScore).level}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Streak */}
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Current Streak</p>
                        <p className="text-3xl font-bold">{analyticsData.streakCount}</p>
                        <p className="text-orange-100 text-xs">Days in a row</p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Achievements</p>
                        <p className="text-3xl font-bold">{analyticsData.achievements.length}</p>
                        <p className="text-purple-100 text-xs">Unlocked</p>
                      </div>
                      <Award className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Goal Progress Chart */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Goal Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formatChartData(analyticsData.weeklyTrends)}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="week" 
                            fontSize={12}
                            tick={{ fill: '#64748b' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar dataKey="completionRate" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Performance */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-green-600" />
                      Category Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formatChartData(analyticsData.categoryStats)}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="completionRate"
                            nameKey="category"
                            label={({ category, completionRate }) => `${category}: ${completionRate}%`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trends and Productivity */}
              {(trends || productivityData) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Trends Chart */}
                  {trends && (
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          Progress Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends.weeklyTrends}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis 
                                dataKey="weekStart" 
                                fontSize={12}
                                tick={{ fill: '#64748b' }}
                              />
                              <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="completionRate" 
                                stroke="#3B82F6" 
                                strokeWidth={3}
                                dot={{ fill: '#3B82F6', r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Most Productive Day */}
                  {productivityData && (
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          Productivity Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Most Productive Day</p>
                          <p className="text-2xl font-bold text-gray-900">{productivityData.mostProductiveDay.dayName}</p>
                          <p className="text-sm text-gray-500">
                            {productivityData.mostProductiveDay.activitiesCount} activities on average
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Avg Progress</p>
                            <p className="text-xl font-bold text-blue-900">
                              {productivityData.mostProductiveDay.averageProgress}%
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Productivity Score</p>
                            <p className="text-xl font-bold text-green-900">
                              {productivityData.mostProductiveDay.productivityScore}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Recent Achievements */}
              {analyticsData.achievements.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analyticsData.achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                        >
                          <div className="flex-shrink-0">
                            <Award className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{achievement.title}</p>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </VolunteerLayout>
  );
};

export default PersonalAnalyticsPage;