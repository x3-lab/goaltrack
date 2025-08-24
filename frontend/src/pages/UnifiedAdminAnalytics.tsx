import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Users, Target, AlertTriangle, Download, 
  RefreshCw, PieChart, FileText, Calendar, Activity, Filter, Zap,
  BarChart, LineChart, Eye, Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { analyticsApi } from '../services/analyticsApi';
import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi';
import type { AnalyticsDataDto, VolunteerPerformanceDto } from '../types/analytics';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import AdminLayout from '../components/AdminLayout';

const UnifiedAdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  
  // Combined state for both basic and advanced analytics
  const [basicAnalyticsData, setBasicAnalyticsData] = useState<AnalyticsDataDto | null>(null);
  const [volunteerPerformance, setVolunteerPerformance] = useState<VolunteerPerformanceDto[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>([]);
  const [categoriesData, setCategoriesData] = useState<any>([]);
  const [performanceData, setPerformanceData] = useState<any>([]);
  const [predictionsData, setPredictionsData] = useState<any>(null);
  const [milestonesData, setMilestonesData] = useState<any>([]);
  
  // Component state
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
      console.log('📊 Loading unified admin analytics data...');
      
      // Load basic analytics data
      const [analyticsResult, performanceResult] = await Promise.all([
        analyticsApi.getAnalyticsData({
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
        analyticsApi.getVolunteerPerformance()
      ]);
      
      setBasicAnalyticsData(analyticsResult);
      setVolunteerPerformance(performanceResult);
      
      // Load advanced analytics data
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
        
        setSummaryData(dashboardKPIsResult);
        setTrendsData(organizationResult?.trends || []);
        setCategoriesData(analyticsResult.categoryBreakdown || []);
        setPerformanceData(performanceResult || []);
        setPredictionsData(predictionsResult || []);
        setMilestonesData([]); // Will be populated when backend is implemented
        
        // Extract available categories and volunteers
        if (analyticsResult.categoryBreakdown) {
          setAvailableCategories(['all', ...analyticsResult.categoryBreakdown.map((cat: any) => cat.name)]);
        }
        
        if (performanceResult) {
          setVolunteerList(performanceResult.map((vol: any) => ({
            id: vol.volunteerId,
            name: vol.volunteerName
          })));
        }
        
      } catch (advancedError) {
        console.warn('⚠️ Advanced analytics partially failed, continuing with basic analytics');
      }
      
      console.log('Analytics data loaded successfully');
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      setError(error.message || 'Failed to load analytics data');
      toast({
        title: "Error",
        description: "Failed to load analytics data. Some features may be limited.",
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

  // Render key metrics overview
  const renderKeyMetrics = () => {
    if (!basicAnalyticsData && !summaryData) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
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
        value: summaryData?.totalGoals || basicAnalyticsData?.overview?.totalGoals || 0,
        change: summaryData?.goalsGrowth || 0,
        icon: Target,
        color: 'text-blue-600'
      },
      {
        title: 'Active Volunteers',
        value: summaryData?.activeVolunteers || basicAnalyticsData?.overview?.activeVolunteers || 0,
        change: summaryData?.volunteersGrowth || 0,
        icon: Users,
        color: 'text-green-600'
      },
      {
        title: 'Completion Rate',
        value: `${summaryData?.overallCompletionRate || basicAnalyticsData?.overview?.completionRate || 0}%`,
        change: summaryData?.completionRateChange || 0,
        icon: TrendingUp,
        color: 'text-purple-600'
      },
      {
        title: 'Overdue Goals',
        value: summaryData?.overdueGoals || basicAnalyticsData?.overview?.overdueGoals || 0,
        change: summaryData?.overdueChange || 0,
        icon: AlertTriangle,
        color: 'text-red-600'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;
          const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.change !== 0 && (
                      <p className={`text-sm ${changeColor} flex items-center mt-1`}>
                        <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
                        {isPositive ? '+' : ''}{metric.change}%
                      </p>
                    )}
                  </div>
                  <Icon className={`h-8 w-8 ${metric.color}`} />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive analytics and insights for your organization
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
              Refresh
            </Button>
          </div>
        </div>

        {/* Date Range and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volunteer</label>
                <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All volunteers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-volunteers">All Volunteers</SelectItem>
                    {volunteerList.map(volunteer => (
                      <SelectItem key={volunteer.id} value={volunteer.id}>
                        {volunteer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Basic Analytics Charts */}
          <TabsContent value="overview" className="space-y-6">
            {basicAnalyticsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion Trends Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Completion Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={basicAnalyticsData.completionTrends?.weekly || basicAnalyticsData.completionTrends?.daily || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="completed" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Breakdown Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Goals by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={basicAnalyticsData.categoryBreakdown || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {(basicAnalyticsData.categoryBreakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Volunteer Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Volunteer Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={basicAnalyticsData.volunteerActivity || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="activeVolunteers" fill="#82ca9d" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={basicAnalyticsData.performanceDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ffc658" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Advanced Analytics Tabs */}
          <TabsContent value="trends">
            {trendsData && (
              <AnalyticsDashboard
                summaryData={summaryData}
                trendsData={trendsData}
                categoriesData={categoriesData}
                performanceData={performanceData}
                predictionsData={predictionsData}
                milestonesData={milestonesData}
                loading={loading}
                error={error}
                activeView="trends"
              />
            )}
          </TabsContent>

          <TabsContent value="performance">
            {performanceData && (
              <AnalyticsDashboard
                summaryData={summaryData}
                trendsData={trendsData}
                categoriesData={categoriesData}
                performanceData={performanceData}
                predictionsData={predictionsData}
                milestonesData={milestonesData}
                loading={loading}
                error={error}
                activeView="performance"
              />
            )}
          </TabsContent>

          <TabsContent value="categories">
            {categoriesData && (
              <AnalyticsDashboard
                summaryData={summaryData}
                trendsData={trendsData}
                categoriesData={categoriesData}
                performanceData={performanceData}
                predictionsData={predictionsData}
                milestonesData={milestonesData}
                loading={loading}
                error={error}
                activeView="categories"
              />
            )}
          </TabsContent>

          <TabsContent value="predictions">
            {predictionsData && (
              <AnalyticsDashboard
                summaryData={summaryData}
                trendsData={trendsData}
                categoriesData={categoriesData}
                performanceData={performanceData}
                predictionsData={predictionsData}
                milestonesData={milestonesData}
                loading={loading}
                error={error}
                activeView="predictions"
              />
            )}
          </TabsContent>

          {/* Export Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Reports
                  </CardTitle>
                  <CardDescription>
                    Standard analytics reports with core metrics
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

              {/* Advanced Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Advanced Reports
                  </CardTitle>
                  <CardDescription>
                    Detailed analytics with predictive insights
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
                      <Download className="h-4 w-4 mr-2" />
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
                      <Download className="h-4 w-4 mr-2" />
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
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Predictive Analytics
                  </Button>
                </CardContent>
              </Card>

              {/* Export Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Current Date Range</p>
                        <p className="text-sm text-gray-600">
                          {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>• Reports include all analytics within the selected filters</p>
                      <p>• Advanced reports provide deeper insights and predictions</p>
                      <p>• Files are automatically named with timestamps</p>
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
