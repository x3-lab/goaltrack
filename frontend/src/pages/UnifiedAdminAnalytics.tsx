import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Users, Target, AlertTriangle, Download, 
  RefreshCw, PieChart, Calendar, Activity, Filter, Zap,
  BarChart, LineChart, Eye, Settings, Clock, Award, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi } from '../services/analyticsApi';
import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi';
import type { AnalyticsDataDto, VolunteerPerformanceDto } from '../types/analytics';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import AdminLayout from '../components/AdminLayout';

const UnifiedAdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataDto | null>(null);
  const [volunteerPerformance, setVolunteerPerformance] = useState<VolunteerPerformanceDto[]>([]);
  const [dashboardKPIs, setDashboardKPIs] = useState<any>(null);
  const [organizationPerformance, setOrganizationPerformance] = useState<any>(null);
  const [goalPredictions, setGoalPredictions] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('all-volunteers');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [category, setCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [volunteerList, setVolunteerList] = useState<{id: string, name: string}[]>([]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

  // Load all analytics data
  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading unified analytics data...');
      
      const [analyticsResult, performanceResult] = await Promise.all([
        analyticsApi.getAnalyticsData({
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
        analyticsApi.getVolunteerPerformance()
      ]);
      
      setAnalyticsData(analyticsResult);
      setVolunteerPerformance(performanceResult);
      
      try {
        const [
          organizationResult,
          predictionsResult,
          dashboardKPIsResult
        ] = await Promise.all([
          advancedAnalyticsApi.getOrganizationPerformance({
            startDate: dateRange.start,
            endDate: dateRange.end
          }),
          advancedAnalyticsApi.getGoalCompletionPredictions(),
          advancedAnalyticsApi.getDashboardKPIs()
        ]);
        
        setDashboardKPIs(dashboardKPIsResult);
        setOrganizationPerformance(organizationResult);
        setGoalPredictions(predictionsResult);
        
      } catch (advancedError) {
        console.warn('Advanced analytics partially failed, continuing with basic analytics');
      }
      
      // Extract categories and volunteers for filtering
      if (analyticsResult.categoryBreakdown) {
        setAvailableCategories(['all', ...analyticsResult.categoryBreakdown.map((cat: any) => cat.name)]);
      }
      
      if (performanceResult) {
        setVolunteerList(performanceResult.map((vol: any) => ({
          id: vol.id,
          name: vol.name
        })));
      }
      
      console.log('Analytics data loaded successfully');
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      setError(error.message || 'Failed to load analytics data');
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Generate and export reports
  const generateReport = async (type: string) => {
    try {
      setExporting(type);
      console.log(`Generating ${type} report...`);
      
      const result = await analyticsApi.exportReport({
        type: type as any,
        filters: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      
      // Create and download blob
      const reportData = JSON.stringify(result.data, null, 2);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${dateRange.start}-to-${dateRange.end}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: `${type} report has been downloaded successfully`,
      });
      
      console.log(`${type} report generated and downloaded`);
    } catch (error: any) {
      console.error('Report generation failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  // Handle advanced analytics export
  const handleAdvancedExport = async (type: string) => {
    try {
      setExporting(type);
      // Since the advanced export API doesn't exist yet, use basic export as fallback
      const result = await analyticsApi.exportReport({
        type: type as any,
        filters: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `advanced-${type}-${dateRange.start}-to-${dateRange.end}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Advanced Report Generated",
        description: `Advanced ${type} report downloaded successfully`,
      });
    } catch (error: any) {
      console.error('Advanced export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export advanced analytics",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  // Render key metrics overview with enhanced design
  const renderKeyMetrics = () => {
    if (!analyticsData && !dashboardKPIs) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-center h-20">
                  <LoadingSpinner size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const metrics = [
      {
        title: 'Total Goals',
        value: dashboardKPIs?.totalGoals || analyticsData?.overview?.totalGoals || 0,
        change: dashboardKPIs?.goalsGrowth || 0,
        icon: Target,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        trend: dashboardKPIs?.goalsGrowth >= 0 ? 'up' : 'down'
      },
      {
        title: 'Active Volunteers',
        value: dashboardKPIs?.activeVolunteers || analyticsData?.overview?.activeVolunteers || 0,
        change: dashboardKPIs?.volunteersGrowth || 0,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: dashboardKPIs?.volunteersGrowth >= 0 ? 'up' : 'down'
      },
      {
        title: 'Completion Rate',
        value: `${dashboardKPIs?.overallCompletionRate || analyticsData?.overview?.completionRate || 0}%`,
        change: dashboardKPIs?.completionRateChange || 0,
        icon: CheckCircle,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        trend: dashboardKPIs?.completionRateChange >= 0 ? 'up' : 'down'
      },
      {
        title: 'Overdue Goals',
        value: dashboardKPIs?.overdueGoals || analyticsData?.overview?.overdueGoals || 0,
        change: dashboardKPIs?.overdueChange || 0,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        trend: dashboardKPIs?.overdueChange <= 0 ? 'up' : 'down' // Inverted - fewer overdue is better
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === 'up';
          const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
          
          return (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{metric.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
                    {metric.change !== 0 && (
                      <div className={`flex items-center ${changeColor}`}>
                        <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
                        <span className="text-sm font-medium">
                          {isPositive ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 md:h-8 md:w-8 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Loading analytics dashboard...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <p className="text-gray-600">
              Comprehensive insights into volunteer performance, goal progress, and organizational metrics
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={loadAnalyticsData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filters Card - Enhanced responsive design */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Analytics Filters
            </CardTitle>
            <CardDescription>Customize your analytics view by adjusting date range and filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-sm">
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Volunteer</Label>
                <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All volunteers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-volunteers" className="text-sm">All Volunteers</SelectItem>
                    {volunteerList.map(volunteer => (
                      <SelectItem key={volunteer.id} value={volunteer.id} className="text-sm">
                        {volunteer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <Button 
                onClick={loadAnalyticsData} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        {renderKeyMetrics()}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Analytics Tabs - Enhanced responsive design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 min-w-[600px] lg:min-w-0">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
                <Eye className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Trends</span>
                <span className="sm:hidden">Trends</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Performance</span>
                <span className="sm:hidden">Perf</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 text-xs sm:text-sm">
                <PieChart className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">Cat</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-2 text-xs sm:text-sm">
                <Zap className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Insights</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 text-xs sm:text-sm">
                <Download className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab - Comprehensive Analytics Charts */}
          <TabsContent value="overview" className="space-y-6">
            {analyticsData ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Completion Trends Chart */}
                <Card className="col-span-full xl:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Completion Trends
                    </CardTitle>
                    <CardDescription>Goal completion progress over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RechartsLineChart data={analyticsData.completionTrends?.weekly || analyticsData.completionTrends?.daily || []}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="completed" 
                          stroke="#0088FE" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#0088FE' }}
                          activeDot={{ r: 6, stroke: '#0088FE', strokeWidth: 2, fill: 'white' }}
                          name="Completed Goals"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Breakdown Chart */}
                <Card className="col-span-full xl:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Goals by Category
                    </CardTitle>
                    <CardDescription>Distribution of goals across categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.categoryBreakdown || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(analyticsData.categoryBreakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any) => [`${value} goals`, 'Count']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Volunteer Activity Chart */}
                <Card className="col-span-full xl:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Volunteer Activity
                    </CardTitle>
                    <CardDescription>Daily volunteer engagement levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RechartsBarChart data={analyticsData.volunteerActivity || []}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="activeVolunteers" 
                          fill="#00C49F" 
                          radius={[4, 4, 0, 0]}
                          name="Active Volunteers"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Distribution */}
                <Card className="col-span-full xl:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Distribution
                    </CardTitle>
                    <CardDescription>Volunteer performance ranges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RechartsBarChart data={analyticsData.performanceDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#FFBB28" 
                          radius={[4, 4, 0, 0]}
                          name="Volunteers"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Analytics Data Available</h3>
                <p className="text-sm text-center max-w-md">
                  Analytics data is not available for the selected date range. Try adjusting your filters or check back later.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Performance Analysis Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Volunteer Performance Chart */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Volunteer Performance
                  </CardTitle>
                  <CardDescription>Individual volunteer goal completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={volunteerPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="goalsCount" name="Total Goals" fill="#8884d8" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="completionRate" name="Completion Rate %" fill="#82ca9d" radius={[2, 2, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Highest achieving volunteers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {volunteerPerformance
                      .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
                      .slice(0, 5)
                      .map((volunteer, index) => (
                        <div key={volunteer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="flex-shrink-0">
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{volunteer.name}</p>
                              <p className="text-xs text-gray-500">{volunteer.goalsCount} goals</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{volunteer.completionRate}%</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Analysis Tab */}
          <TabsContent value="trends" className="space-y-6">
            {organizationPerformance ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Trends Chart */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Trends
                    </CardTitle>
                    <CardDescription>Organization-wide performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLineChart data={organizationPerformance.trends || []}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="period" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="completionRate"
                          name="Completion Rate"
                          stroke="#0088FE"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="activeVolunteers"
                          name="Active Volunteers"
                          stroke="#00C49F"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Trend Data Available</h3>
                <p className="text-sm text-center max-w-md">
                  Trend analysis data is not available yet. This requires historical data to be collected over time.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Categories Analysis Tab */}
          <TabsContent value="categories" className="space-y-6">
            {analyticsData?.categoryBreakdown && analyticsData.categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Category Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Category Distribution
                    </CardTitle>
                    <CardDescription>Goals distribution across categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value} goals`, 'Count']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Category Details
                    </CardTitle>
                    <CardDescription>Detailed breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.categoryBreakdown.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium text-sm">{category.name}</p>
                              <p className="text-xs text-gray-500">
                                {((category.value / analyticsData.categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1)}% of total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{category.value}</p>
                            <p className="text-xs text-gray-500">goals</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <PieChart className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Category Data Available</h3>
                <p className="text-sm text-center max-w-md">
                  Category breakdown data is not available. Goals need to be categorized to display this analysis.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Insights & Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Risk Assessment
                  </CardTitle>
                  <CardDescription>Goals at risk of missing deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-red-800">High Risk Goals</p>
                          <p className="text-sm text-red-600">Likely to miss deadlines</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-800">
                          {goalPredictions?.atRiskGoals || analyticsData?.overview?.overdueGoals || 0}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-blue-600 mb-1">Expected This Week</p>
                        <p className="text-xl font-bold text-blue-800">
                          {goalPredictions?.expectedCompletions?.thisWeek || 0}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-green-600 mb-1">Expected Next Week</p>
                        <p className="text-xl font-bold text-green-800">
                          {goalPredictions?.expectedCompletions?.nextWeek || 0}
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600 mb-1">Projected Monthly Completion</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-purple-800">
                          {goalPredictions?.projectedCompletionRate || dashboardKPIs?.overallCompletionRate || 0}%
                        </p>
                        <p className="text-sm text-purple-600">completion rate</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Performance Insights
                  </CardTitle>
                  <CardDescription>Key insights and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                      <h4 className="font-medium text-blue-800 mb-1">Completion Rate Trend</h4>
                      <p className="text-sm text-blue-700">
                        {dashboardKPIs?.completionRateChange && dashboardKPIs.completionRateChange > 0 
                          ? `Completion rates have improved by ${dashboardKPIs.completionRateChange}% this period.`
                          : dashboardKPIs?.completionRateChange && dashboardKPIs.completionRateChange < 0
                          ? `Completion rates have declined by ${Math.abs(dashboardKPIs.completionRateChange)}% this period.`
                          : 'Completion rates are stable this period.'
                        }
                      </p>
                    </div>

                    <div className="p-4 border-l-4 border-green-500 bg-green-50">
                      <h4 className="font-medium text-green-800 mb-1">Volunteer Engagement</h4>
                      <p className="text-sm text-green-700">
                        {dashboardKPIs?.activeVolunteers || volunteerPerformance.length || 0} volunteers are actively working on goals.
                        {dashboardKPIs?.volunteersGrowth && dashboardKPIs.volunteersGrowth > 0 && (
                          ` This represents a ${dashboardKPIs.volunteersGrowth}% increase.`
                        )}
                      </p>
                    </div>

                    <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                      <h4 className="font-medium text-amber-800 mb-1">Action Required</h4>
                      <p className="text-sm text-amber-700">
                        {(dashboardKPIs?.overdueGoals || analyticsData?.overview?.overdueGoals || 0) > 0 
                          ? `${dashboardKPIs?.overdueGoals || analyticsData?.overview?.overdueGoals} goals are overdue and need immediate attention.`
                          : 'All goals are on track. Great job maintaining momentum!'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Export Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Analytics Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Analytics Reports
                  </CardTitle>
                  <CardDescription>
                    Export comprehensive analytics data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('overview')}
                    disabled={!!exporting}
                  >
                    {exporting === 'overview' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Overview Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('performance')}
                    disabled={!!exporting}
                  >
                    {exporting === 'performance' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Performance Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('goals')}
                    disabled={!!exporting}
                  >
                    {exporting === 'goals' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Goals Report
                  </Button>
                </CardContent>
              </Card>

              {/* Detailed Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detailed Reports
                  </CardTitle>
                  <CardDescription>
                    Advanced analytics with insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAdvancedExport('trends')}
                    disabled={!!exporting}
                  >
                    {exporting === 'trends' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Trends Analysis
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAdvancedExport('categories')}
                    disabled={!!exporting}
                  >
                    {exporting === 'categories' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <PieChart className="h-4 w-4 mr-2" />
                    )}
                    Categories Analysis
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAdvancedExport('predictions')}
                    disabled={!!exporting}
                  >
                    {exporting === 'predictions' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Insights Report
                  </Button>
                </CardContent>
              </Card>

              {/* Export Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Export Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Date Range</p>
                        <p className="text-xs text-gray-600">
                          {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Category Filter</p>
                        <p className="text-xs text-gray-600">{category === 'all' ? 'All Categories' : category}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Volunteer Filter</p>
                        <p className="text-xs text-gray-600">
                          {selectedVolunteerId === 'all-volunteers' 
                            ? 'All Volunteers' 
                            : volunteerList.find(v => v.id === selectedVolunteerId)?.name || 'All Volunteers'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>• Reports include data within selected filters</p>
                        <p>• Files are exported in JSON format</p>
                        <p>• Timestamps are included in filenames</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default UnifiedAdminAnalytics;
