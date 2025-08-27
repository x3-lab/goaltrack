import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Users, Target, AlertTriangle, Download, 
  RefreshCw, PieChart, FileText, Calendar, Activity, Filter, Zap
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
import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

const AdminAdvancedAnalytics: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>([]);
  const [categoriesData, setCategoriesData] = useState<any>([]);
  const [performanceData, setPerformanceData] = useState<any>([]);
  const [predictionsData, setPredictionsData] = useState<any>(null);
  const [milestonesData, setMilestonesData] = useState<any>([]);
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('organization');
  const [exporting, setExporting] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [category, setCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [volunteerList, setVolunteerList] = useState<{id: string, name: string}[]>([]);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading advanced analytics data...');
      
      const orgPerformance = await advancedAnalyticsApi.getOrganizationPerformance({
        startDate: dateRange.start,
        endDate: dateRange.end,
        category: category !== 'all' ? category : undefined
      });
      
      setAvailableCategories(['all', ...orgPerformance.categories.map(c => c.name)]);
      
      const volList = [
        ...orgPerformance.topPerformers.map(v => ({ id: v.volunteerId, name: v.volunteerName })),
        ...orgPerformance.lowPerformers.map(v => ({ id: v.volunteerId, name: v.volunteerName }))
      ];
      setVolunteerList(volList);

      const dashboardKPIs = await advancedAnalyticsApi.getDashboardKPIs();
      
      setSummaryData(dashboardKPIs.summary);
      setPredictionsData(dashboardKPIs.predictions);
      setCategoriesData(dashboardKPIs.topCategories);
      setMilestonesData(dashboardKPIs.recentMilestones);
      
      setTrendsData(orgPerformance.trends.weeklyActivity.map(week => ({
        period: week.week,
        completionRate: week.completionRate,
        activeVolunteers: week.activeVolunteers
      })));
      
      setPerformanceData(orgPerformance.topPerformers.map(performer => ({
        volunteerId: performer.volunteerId,
        volunteerName: performer.volunteerName,
        completedGoals: performer.completedGoals,
        completionRate: performer.completionRate
      })));
      
      console.log('Advanced analytics data loaded successfully');
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
  }, [dateRange, category, toast]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const handleRefresh = async () => {
    await loadAnalyticsData();
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated with the latest information.",
    });
  };

  const handleExport = async (reportType: string) => {
    try {
      setExporting(reportType);
      console.log(`Generating ${reportType} report...`);
      
      const result = await advancedAnalyticsApi.generateReport(
        reportType as any, 
        { 
          filters: {
            startDate: dateRange.start,
            endDate: dateRange.end,
            category: category !== 'all' ? category : undefined
          },
          format: 'json',
          volunteerId: selectedVolunteerId || undefined
        }
      );
      
      // Create and download the report
      const reportData = JSON.stringify(result.data, null, 2);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: `${reportType} report has been downloaded successfully`,
      });
      
      console.log(`${reportType} report generated and downloaded`);
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

  const loadVolunteerAnalytics = async (volunteerId: string) => {
    if (!volunteerId) return;
    
    setLoading(true);
    try {
      console.log(`👤 Loading analytics for volunteer ${volunteerId}...`);
      
      const volunteerMetrics = await advancedAnalyticsApi.getVolunteerPerformanceMetrics(volunteerId);
      
      setPerformanceData([{
        volunteerId: volunteerMetrics.volunteerId,
        volunteerName: volunteerMetrics.volunteerName,
        completedGoals: volunteerMetrics.metrics.goalsCompleted,
        completionRate: volunteerMetrics.metrics.completionRate,
        averageCompletionTime: volunteerMetrics.metrics.averageCompletionTime,
        consistency: volunteerMetrics.metrics.consistencyScore
      }]);
      
      setCategoriesData(volunteerMetrics.metrics.categoriesBreakdown.map(cat => ({
        name: cat.category,
        count: cat.count,
        completionRate: cat.completionRate
      })));
      
      setTrendsData([
        { period: 'Last Week', completionRate: volunteerMetrics.metrics.trend.lastWeek },
        { period: 'Last Month', completionRate: volunteerMetrics.metrics.trend.lastMonth },
        { period: 'Current', completionRate: volunteerMetrics.metrics.completionRate }
      ]);
      
      toast({
        title: "Volunteer Data Loaded",
        description: `Viewing analytics for ${volunteerMetrics.volunteerName}`
      });
    } catch (error: any) {
      console.error('Error loading volunteer analytics:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load volunteer analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerChange = (value: string) => {
    setSelectedVolunteerId(value);
    if (value) {
      loadVolunteerAnalytics(value);
      setActiveTab('volunteer');
    } else {
      loadAnalyticsData();
      setActiveTab('organization');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics and insights for your organization</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedVolunteerId} onValueChange={handleVolunteerChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Volunteer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Volunteers</SelectItem>
                {volunteerList.map(vol => (
                  <SelectItem key={vol.id} value={vol.id}>{vol.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              
              <Button onClick={() => handleExport(activeTab)} disabled={loading || !!exporting}>
                {exporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Date Range Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
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
              <Button 
                onClick={loadAnalyticsData} 
                disabled={loading}
                className="mb-1"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organization">Organization Analytics</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteer Performance</TabsTrigger>
            <TabsTrigger value="predictions">Predictions & Insights</TabsTrigger>
          </TabsList>

          {/* Organization Analytics Tab */}
          <TabsContent value="organization" className="space-y-6">
            <AnalyticsDashboard
              summaryData={summaryData}
              trendsData={trendsData}
              categoriesData={categoriesData}
              performanceData={performanceData}
              predictionsData={predictionsData}
              milestonesData={milestonesData}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* Volunteer Performance Tab */}
          <TabsContent value="volunteer" className="space-y-6">
            {selectedVolunteerId ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Volunteer Performance Metrics
                    </CardTitle>
                    <CardDescription>
                      Detailed analysis of volunteer performance and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : performanceData.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="font-medium text-blue-800 mb-1">Volunteer Profile</h3>
                            <p className="text-xl font-bold text-blue-900">{performanceData[0].volunteerName}</p>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div>
                                <p className="text-sm text-blue-700">Completed Goals</p>
                                <p className="text-lg font-bold">{performanceData[0].completedGoals}</p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700">Completion Rate</p>
                                <p className="text-lg font-bold">{performanceData[0].completionRate}%</p>
                              </div>
                              {performanceData[0].averageCompletionTime && (
                                <div>
                                  <p className="text-sm text-blue-700">Avg. Completion Time</p>
                                  <p className="text-lg font-bold">{performanceData[0].averageCompletionTime} days</p>
                                </div>
                              )}
                              {performanceData[0].consistency && (
                                <div>
                                  <p className="text-sm text-blue-700">Consistency Score</p>
                                  <p className="text-lg font-bold">{performanceData[0].consistency}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium mb-3">Category Performance</h3>
                            <div className="space-y-3">
                              {categoriesData.map((category: any, index: number) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>{category.name}</span>
                                    <span className="font-medium">{category.count} goals</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${category.completionRate}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {category.completionRate}% completion rate
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-green-50 rounded-lg p-4">
                            <h3 className="font-medium text-green-800 mb-3">Performance Trend</h3>
                            {trendsData.length > 0 ? (
                              <div className="space-y-4">
                                {trendsData.map((trend: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-green-700">{trend.period}</span>
                                    <div className="flex-1 mx-4">
                                      <div className="w-full bg-green-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-600 h-2.5 rounded-full" 
                                          style={{ width: `${trend.completionRate}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="font-bold text-green-900">{trend.completionRate}%</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-green-700 text-center py-4">No trend data available</p>
                            )}
                          </div>
                          
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h3 className="font-medium text-purple-800 mb-1">Recommendations</h3>
                            <ul className="mt-3 space-y-2">
                              <li className="flex items-start gap-2">
                                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-purple-900 font-medium">Recognize consistent performance</p>
                                  <p className="text-sm text-purple-700">Volunteer has maintained a strong completion rate over time.</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-purple-900 font-medium">Consider complexity increase</p>
                                  <p className="text-sm text-purple-700">Based on performance, volunteer may be ready for more challenging goals.</p>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Select a volunteer to view detailed performance metrics</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleExport('volunteer')}
                      disabled={!selectedVolunteerId || loading || !!exporting}
                      className="ml-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Volunteer Report
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 px-4 border rounded-lg">
                <div className="text-center max-w-md">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Volunteer</h3>
                  <p className="text-gray-600 mb-4">Choose a volunteer from the dropdown above to view their detailed performance metrics and analytics.</p>
                  <Select value={selectedVolunteerId} onValueChange={handleVolunteerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteerList.map(vol => (
                        <SelectItem key={vol.id} value={vol.id}>{vol.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Predictions & Insights Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goal Completion Predictions
                </CardTitle>
                <CardDescription>
                  AI-powered predictions for goal completions and risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-blue-800 mb-1">Completion Forecast</h3>
                          <div className="text-3xl font-bold text-blue-900">
                            {predictionsData?.expectedCompletions?.thisWeek || 0}
                          </div>
                          <p className="text-sm text-blue-700 mt-1">Expected completions this week</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-green-800 mb-1">Projected Rate</h3>
                          <div className="text-3xl font-bold text-green-900">
                            {predictionsData?.projectedCompletionRate || 0}%
                          </div>
                          <p className="text-sm text-green-700 mt-1">Projected completion rate</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-red-50 border-red-100">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-red-800 mb-1">At-Risk Goals</h3>
                          <div className="text-3xl font-bold text-red-900">
                            {predictionsData?.atRiskGoals || 0}
                          </div>
                          <p className="text-sm text-red-700 mt-1">Goals at risk of missing deadlines</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Risk Assessment & Recommendations</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-amber-900">Identified Risk Patterns</p>
                              <p className="text-sm text-amber-700 mt-1">
                                Several goals with similar characteristics are falling behind schedule. Consider reviewing goals in the "Community Outreach" category.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Activity Insights</p>
                              <p className="text-sm text-blue-700 mt-1">
                                Volunteers are most active on Tuesdays and Wednesdays. Consider scheduling important deadlines mid-week for better engagement rates.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-900">Performance Optimization</p>
                              <p className="text-sm text-green-700 mt-1">
                                Breaking large goals into smaller milestones has shown a 15% increase in completion rates. Consider restructuring complex goals.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('predictions')}
                  disabled={loading || !!exporting}
                  className="ml-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Predictions Report
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Insights
                </CardTitle>
                <CardDescription>
                  In-depth analysis of goal categories and performance patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Category Performance</h3>
                        <div className="space-y-4">
                          {categoriesData && categoriesData.map((category: any, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{category.name}</h4>
                                <Badge variant="outline">{category.count} goals</Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${category.completionRate}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>{category.completionRate}% completion rate</span>
                                <span className={category.trend > 0 ? 'text-green-600' : category.trend < 0 ? 'text-red-600' : 'text-gray-600'}>
                                  {category.trend > 0 ? `↑ ${category.trend}%` : category.trend < 0 ? `↓ ${Math.abs(category.trend)}%` : 'No change'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                        <div className="space-y-4">
                          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <h4 className="font-medium text-purple-900 mb-2">Category Optimization</h4>
                            <ul className="space-y-3">
                              <li className="flex items-start gap-2">
                                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                                <span className="text-sm text-purple-800">Focus resources on "Training" category to improve overall completion rates</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                                <span className="text-sm text-purple-800">Consider reducing complexity of goals in "Community Service" category</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                                <span className="text-sm text-purple-800">Add more volunteers to "Education" category for better distribution</span>
                              </li>
                            </ul>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Goal Structuring</h4>
                            <p className="text-sm text-blue-800 mb-3">
                              Analysis shows that goals with these characteristics have higher completion rates:
                            </p>
                            <ul className="space-y-2">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm text-blue-800">2-3 week timeframes</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm text-blue-800">Clear, measurable outcomes</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm text-blue-800">Regular check-in points</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('categories')}
                  disabled={loading || !!exporting}
                  className="ml-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Categories Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAdvancedAnalytics;