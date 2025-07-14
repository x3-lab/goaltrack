import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Target, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '../services/adminApi';

interface AnalyticsData {
  overview: {
    totalVolunteers: number;
    activeVolunteers: number;
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    overdueGoals: number;
  };
  completionTrends: {
    daily: Array<{
      date: string;
      completed: number;
      total: number;
      period: string;
    }>;
    weekly: Array<{
      date: string;
      completed: number;
      total: number;
      period: string;
    }>;
  };
  performanceDistribution: Array<{
    name: string;
    value: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
  }>;
  volunteerActivity: Array<{
    name: string;
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
  }>;
}

const SystemAnalyticsPage: React.FC = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30days');
  const [trendView, setTrendView] = useState('weekly');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const getDateRangeFromFilter = (filter: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (filter) {
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case '90days':
        start.setDate(now.getDate() - 90);
        break;
      case '1year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateRange = getDateRangeFromFilter(timeRange);
      const data = await adminApi.getAnalyticsData(dateRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  // Colors for charts
  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const renderCompletionTrendsChart = (data: any[], title: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="period" 
          tick={{ fontSize: 12 }}
          interval={trendView === 'daily' ? 'preserveStartEnd' : 0}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(label) => `Period: ${label}`}
          formatter={(value: any, name: string) => [
            value, 
            name === 'completed' ? 'Completed Goals' : 'Total Goals'
          ]}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#8884d8" 
          name="Total Goals"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke="#82ca9d" 
          name="Completed Goals"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-40 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your organization's performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.activeVolunteers} active volunteers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.overdueGoals} overdue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              out of {analyticsData.overview.totalGoals} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              organization average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trends with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={trendView} onValueChange={setTrendView}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly">Weekly Trends</TabsTrigger>
                <TabsTrigger value="daily">Daily Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="mt-4">
                {renderCompletionTrendsChart(
                  analyticsData.completionTrends.weekly,
                  'Weekly Completion Trends'
                )}
              </TabsContent>
              
              <TabsContent value="daily" className="mt-4">
                {renderCompletionTrendsChart(
                  analyticsData.completionTrends.daily,
                  'Daily Completion Trends'
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Analysis and Volunteer Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.categoryBreakdown} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: any) => [value, 'Goals']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Volunteers */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {analyticsData.volunteerActivity.length > 0 ? (
                analyticsData.volunteerActivity
                  .sort((a, b) => b.completionRate - a.completionRate)
                  .slice(0, 10)
                  .map((volunteer, index) => (
                    <div key={volunteer.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{volunteer.name}</h4>
                          <p className="text-sm text-gray-600">
                            {volunteer.completedGoals}/{volunteer.totalGoals} goals completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {volunteer.completionRate}%
                        </div>
                        <div className="text-sm text-gray-600">completion rate</div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No volunteer activity data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.overview.totalVolunteers > 0 ? 
                  ((analyticsData.overview.activeVolunteers / analyticsData.overview.totalVolunteers) * 100).toFixed(1) : '0'
                }%
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Volunteer Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.overview.totalGoals > 0 && analyticsData.overview.activeVolunteers > 0 ? 
                  (analyticsData.overview.totalGoals / analyticsData.overview.activeVolunteers).toFixed(1) : '0'
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Goals per Volunteer</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.categoryBreakdown.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Goal Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAnalyticsPage;