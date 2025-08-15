import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, BarChart as ChartIcon, Users, Target, Filter,
  Download, RefreshCw, Calendar, Activity, AlertTriangle
} from 'lucide-react';

// Common chart config
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Key Metrics Component
export const KeyMetrics = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-gray-500 py-4">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
        <p>Could not load metrics</p>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      change: data.completionTrend,
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />
    },
    {
      title: 'Active Volunteers',
      value: data.activeVolunteers,
      change: data.volunteersTrend,
      icon: <Users className="h-5 w-5 text-green-500" />
    },
    {
      title: 'In-Progress Goals',
      value: data.goalsInProgress,
      icon: <Target className="h-5 w-5 text-orange-500" />
    },
    {
      title: 'Avg. Completion',
      value: `${data.averageCompletionTime} days`,
      icon: <Calendar className="h-5 w-5 text-purple-500" />
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{metric.title}</p>
              <h3 className="text-2xl font-bold">{metric.value}</h3>
              {metric.change !== undefined && (
                <p className={`text-sm ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                </p>
              )}
            </div>
            <div className="p-3 bg-gray-50 rounded-full">
              {metric.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Completion Trends Chart
export const CompletionTrendsChart = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading chart...</span>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <ChartIcon className="h-5 w-5 mx-auto mb-2" />
        <p>No completion trend data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="completionRate"
          name="Completion Rate"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="activeVolunteers"
          name="Active Volunteers"
          stroke="#82ca9d"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Category Distribution Chart
export const CategoryDistributionChart = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading chart...</span>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <ChartIcon className="h-5 w-5 mx-auto mb-2" />
        <p>No category distribution data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          fill="#8884d8"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any, name: any) => [`${value} goals`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Volunteer Performance Chart
export const VolunteerPerformanceChart = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading chart...</span>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <ChartIcon className="h-5 w-5 mx-auto mb-2" />
        <p>No volunteer performance data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="volunteerName" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="completedGoals" name="Completed Goals" fill="#8884d8" />
        <Bar dataKey="completionRate" name="Completion Rate" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Risk Assessment Component
export const RiskAssessmentCard = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading risk assessment...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-gray-500 py-4">
        <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
        <p>Could not load risk assessment</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          At-Risk Goals
        </CardTitle>
        <CardDescription>Goals that may miss their deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Badge className="bg-red-100 text-red-800 mr-2">
                {data.atRiskGoals} goals
              </Badge>
              <span className="text-sm">At risk of missing deadlines</span>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-sm font-medium mb-2">Expected Completions</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 p-2 rounded-md">
                <p className="text-xs text-blue-800">This Week</p>
                <p className="text-lg font-bold text-blue-900">{data.expectedCompletions.thisWeek}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-md">
                <p className="text-xs text-green-800">Next Week</p>
                <p className="text-lg font-bold text-green-900">{data.expectedCompletions.nextWeek}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-sm font-medium mb-1">Projected Completion Rate</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold">{data.projectedCompletionRate}%</span>
              <span className="text-sm text-gray-500 ml-2">by end of month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Top Categories Component
export const TopCategoriesCard = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <ChartIcon className="h-5 w-5 mx-auto mb-2" />
        <p>No category data available</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Top Categories
        </CardTitle>
        <CardDescription>Most popular goal categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((category: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                <Badge variant="outline">{category.count} goals</Badge>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${category.completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{category.completionRate}% completion rate</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600">
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Recent Milestones Component
export const RecentMilestonesCard = ({ data, loading, error }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Loading milestones...</span>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <Activity className="h-5 w-5 mx-auto mb-2" />
        <p>No milestones available</p>
      </div>
    );
  }

  const getIconByType = (type: string) => {
    switch (type) {
      case 'volunteer':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'completion':
        return <Target className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          Recent Milestones
        </CardTitle>
        <CardDescription>Organization achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((milestone: any, index: number) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0 border-gray-100">
              <div className="p-2 bg-gray-50 rounded-full">
                {getIconByType(milestone.type)}
              </div>
              <div>
                <p className="text-sm font-medium">{milestone.description}</p>
                <p className="text-xs text-gray-500">{new Date(milestone.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Analytics Dashboard Container
export const AnalyticsDashboard = ({
  summaryData,
  trendsData,
  categoriesData,
  performanceData,
  predictionsData,
  milestonesData,
  loading,
  error,
  onRefresh
}: any) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <KeyMetrics 
        data={summaryData} 
        loading={loading} 
        error={error} 
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Completion Trends
              </CardTitle>
              <CardDescription>Goal completion rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <CompletionTrendsChart 
                data={trendsData} 
                loading={loading} 
                error={error} 
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartIcon className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Goals by category</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryDistributionChart 
                  data={categoriesData} 
                  loading={loading} 
                  error={error} 
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <TopCategoriesCard 
                data={categoriesData} 
                loading={loading} 
                error={error} 
              />
              <RecentMilestonesCard 
                data={milestonesData} 
                loading={loading} 
                error={error} 
              />
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Volunteer Performance
              </CardTitle>
              <CardDescription>Completion rates by volunteer</CardDescription>
            </CardHeader>
            <CardContent>
              <VolunteerPerformanceChart 
                data={performanceData} 
                loading={loading} 
                error={error} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RiskAssessmentCard 
              data={predictionsData} 
              loading={loading} 
              error={error} 
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Completions
                </CardTitle>
                <CardDescription>Predicted goal completions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Simplified content for demonstration */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-1">Expected This Month</h3>
                    <div className="text-3xl font-bold text-green-900">
                      {predictionsData?.expectedCompletions?.thisWeek + predictionsData?.expectedCompletions?.nextWeek || 0}
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Projected completion rate: {predictionsData?.projectedCompletionRate || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;