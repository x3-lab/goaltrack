import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Target, Calendar, RefreshCw, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi } from '../services/analyticsApi';
import type { AnalyticsDataDto } from '../types/analytics';

const SystemAnalyticsPage: React.FC = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30days');
  const [trendView, setTrendView] = useState('weekly');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const getDateRangeFromFilter = (filter: string) => {
    const dateRange = analyticsApi.getDateRange(filter as any);
    return dateRange;
  };

  const loadAnalyticsData = async () => {
    if (!refreshing) setLoading(true);
    setError(null);
    
    try {
      const dateRange = getDateRangeFromFilter(timeRange);
      console.log('📊 Loading analytics data for range:', dateRange);
      
      const data = await analyticsApi.getAnalyticsData(dateRange);
      setAnalyticsData(data);
      
      console.log('✅ Analytics data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading analytics data:', error);
      setError('Failed to load analytics data');
      toast({
        title: "Error",
        description: "Failed to load analytics data. Using fallback data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
  };

  const handleExport = async (type: 'overview' | 'performance' | 'goals') => {
    try {
      setExporting(type);
      const dateRange = getDateRangeFromFilter(timeRange);
      
      const result = await analyticsApi.exportReport({
        type,
        filters: dateRange
      });
      
      // Create and download blob
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `${type} report has been downloaded successfully`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export report",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  // Colors for charts
  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const renderCompletionTrendsChart = (data: any[], title: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="period" 
          tick={{ fontSize: 12 }}
          interval={Math.max(0, Math.floor(data.length / 6))}
        />
        <YAxis />
        <Tooltip 
          formatter={(value: any, name: string) => [
            name === 'completed' ? `${value} completed` : `${value} total`,
            name === 'completed' ? 'Completed Goals' : 'Total Goals'
          ]}
          labelFormatter={(label) => `Period: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: '#10b981' }}
          name="completed"
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#6b7280" 
          strokeWidth={2}
          dot={{ fill: '#6b7280' }}
          name="total"
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
          <span className="ml-3 text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
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

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
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
          
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Select value={exporting || ''} onValueChange={(value) => value && handleExport(value as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Export..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview Report</SelectItem>
              <SelectItem value="performance">Performance Report</SelectItem>
              <SelectItem value="goals">Goals Report</SelectItem>
            </SelectContent>
          </Select>
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
      <Tabs value={trendView} onValueChange={setTrendView}>
        <TabsList>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Goal Completion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCompletionTrendsChart(analyticsData.completionTrends.daily, 'Daily Trends')}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Goal Completion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCompletionTrendsChart(analyticsData.completionTrends.weekly, 'Weekly Trends')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance and Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip formatter={(value: any) => [value, 'Goals']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Volunteer Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Volunteers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {analyticsData.volunteerActivity.length > 0 ? (
              analyticsData.volunteerActivity
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 15)
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

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.overview.totalGoals > 0 && analyticsData.overview.activeVolunteers > 0 ? 
                  (analyticsData.overview.totalGoals / analyticsData.overview.activeVolunteers).toFixed(1) : '0'
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Goals per Volunteer</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.overview.totalGoals > 0 ? 
                  Math.round((analyticsData.overview.completedGoals / analyticsData.overview.totalGoals) * 100) : 0
                }%
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Success Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.categoryBreakdown.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Goal Categories</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analyticsData.volunteerActivity.filter(v => v.totalGoals > 0).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Contributors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAnalyticsPage;