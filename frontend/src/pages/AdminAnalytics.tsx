import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart, Download, Calendar, TrendingUp, Users, Target, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi } from '../services/analyticsApi';
import type { AnalyticsDataDto, VolunteerPerformanceDto } from '../types/analytics';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const AdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataDto | null>(null);
  const [volunteerPerformance, setVolunteerPerformance] = useState<VolunteerPerformanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading admin analytics data...');
      
      // Load comprehensive analytics data
      const [analyticsResult, performanceResult] = await Promise.all([
        analyticsApi.getAnalyticsData({
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
        analyticsApi.getVolunteerPerformance()
      ]);
      
      setAnalyticsData(analyticsResult);
      setVolunteerPerformance(performanceResult);
      
      console.log('✅ Admin analytics data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Using fallback data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    try {
      setExporting(type);
      console.log(`📋 Generating ${type} report...`);
      
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
      
      console.log(`✅ ${type} report generated and downloaded`);
    } catch (error: any) {
      console.error('❌ Report generation failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No analytics data available</p>
        <Button onClick={loadAnalyticsData} variant="outline">
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateReport(reportType)}
            disabled={!!exporting}
            className="gap-2"
          >
            {exporting === reportType ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
                  <SelectItem value="goals">Goals Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volunteers</p>
                <p className="text-2xl font-bold">{analyticsData.overview.totalVolunteers}</p>
                <Badge variant="secondary" className="mt-1">
                  {analyticsData.overview.activeVolunteers} active
                </Badge>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold">{analyticsData.overview.totalGoals}</p>
                <Badge variant="outline" className="mt-1">
                  {analyticsData.overview.overdueGoals} overdue
                </Badge>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analyticsData.overview.completionRate}%</p>
                <Badge 
                  variant={analyticsData.overview.completionRate >= 80 ? "default" : "secondary"}
                  className="mt-1"
                >
                  {analyticsData.overview.completionRate >= 80 ? "Excellent" : "Good"}
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{analyticsData.categoryBreakdown.length}</p>
                <Badge variant="outline" className="mt-1">
                  Active areas
                </Badge>
              </div>
              <BarChart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="export">Export & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Goals by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={analyticsData.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [value, 'Goals']} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Performance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.performanceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Completion Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Goal Completion Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={analyticsData.completionTrends.weekly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Completed Goals"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#6b7280" 
                    strokeWidth={2}
                    name="Total Goals"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Volunteer Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Volunteer Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Volunteer</th>
                      <th className="text-left p-3 font-medium">Total Goals</th>
                      <th className="text-left p-3 font-medium">Completed</th>
                      <th className="text-left p-3 font-medium">Completion Rate</th>
                      <th className="text-left p-3 font-medium">Avg Progress</th>
                      <th className="text-left p-3 font-medium">Streak</th>
                      <th className="text-left p-3 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteerPerformance
                      .sort((a, b) => b.completionRate - a.completionRate)
                      .map((volunteer) => (
                      <tr key={volunteer.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{volunteer.name}</div>
                            <div className="text-gray-500 text-xs">{volunteer.email}</div>
                          </div>
                        </td>
                        <td className="p-3 font-medium">{volunteer.totalGoals}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {volunteer.completedGoals}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{volunteer.completionRate}%</div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Math.min(100, volunteer.completionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{volunteer.averageProgress}%</td>
                        <td className="p-3">
                          <Badge variant="secondary">
                            {volunteer.streakCount} weeks
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(volunteer.lastActivityDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {volunteerPerformance.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No volunteer performance data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Overview Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Complete system overview with all key metrics and summaries.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('overview')}
                  disabled={exporting === 'overview'}
                >
                  {exporting === 'overview' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Overview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Detailed volunteer performance metrics and analytics.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('performance')}
                  disabled={exporting === 'performance'}
                >
                  {exporting === 'performance' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Performance
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Comprehensive goals analysis with trends and insights.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('goals')}
                  disabled={exporting === 'goals'}
                >
                  {exporting === 'goals' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Goals
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Export History / Status */}
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
                  <p>• Reports are generated in JSON format for easy processing</p>
                  <p>• Data includes all filtered analytics within the selected date range</p>
                  <p>• Export files are automatically named with date range for organization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;