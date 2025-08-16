import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Calendar, Target, Clock, BarChart3, Activity, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { progressHistoryApi, type VolunteerTrendsDto, type MostProductiveDayDto } from '../services/progressHistoryApi';
import { analyticsApi } from '../services/analyticsApi';
import { type PersonalAnalyticsDto } from '../types/analytics';


interface PersonalAnalyticsProps {
  volunteerId?: string;
  showInsights?: boolean;
  compact?: boolean;

  // New props for integration with parent components
  analytics?: PersonalAnalyticsDto | null;
  onRefresh?: () => Promise<void>;
}

const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = ({ 
  volunteerId, 
  showInsights = true,
  compact = false,
  analytics: externalAnalytics = null,
  onRefresh
}) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<PersonalAnalyticsDto | null>(externalAnalytics);
  const [trends, setTrends] = useState<VolunteerTrendsDto | null>(null);
  const [productivityData, setProductivityData] = useState<MostProductiveDayDto | null>(null);
  const [loading, setLoading] = useState(!externalAnalytics);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'productivity'>('overview');

  useEffect(() => {
    // If external analytics are provided, use them
    if (externalAnalytics) {
      setAnalytics(externalAnalytics);
      setLoading(false);
    } else {
      // Otherwise load data ourselves
      loadAnalyticsData();
    }
  }, [volunteerId, externalAnalytics]);

  const loadAnalyticsData = async () => {
    // If onRefresh is provided, use that instead
    if (onRefresh) {
      await onRefresh();
      return;
    }

    setLoading(true);
    try {
      console.log('📊 Loading personal analytics data...');
      
      const currentUserId = volunteerId || localStorage.getItem('currentUserId') || 'current-user';
      
      // Load all analytics data in parallel
      const [analyticsResult, trendsResult, productivityResult] = await Promise.all([
        analyticsApi.getPersonalAnalytics(currentUserId),
        progressHistoryApi.getVolunteerTrends(currentUserId),
        progressHistoryApi.getVolunteerMostProductiveDay(currentUserId)
      ]);
      
      setAnalytics(analyticsResult);
      setTrends(trendsResult);
      setProductivityData(productivityResult);
      
      console.log('Personal analytics data loaded successfully');
      
    } catch (error: any) {
      console.error('Error loading personal analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load personal analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // When externalAnalytics changes, we need to update our state
  useEffect(() => {
    if (externalAnalytics) {
      setAnalytics(externalAnalytics);
    }
  }, [externalAnalytics]);

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { level: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 70) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { level: 'Fair', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getStreakIcon = (count: number) => {
    if (count >= 10) return '🔥';
    if (count >= 5) return '⭐';
    if (count >= 3) return '🌟';
    return '✨';
  };

  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Analytics</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-lg">Loading your analytics...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || !trends) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No analytics data available</p>
            <button
              onClick={loadAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Data
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel(analytics.performanceScore);
  const hasProductivity =
    !!productivityData &&
    !!productivityData.mostProductiveDay &&
    typeof productivityData.mostProductiveDay.dayName === 'string';
  const hasTrends =
    !!trends &&
    Array.isArray(trends.weeklyTrends) &&
    trends.weeklyTrends.length > 0;

  // Normalize weekly trends
  const normalizedWeeklyTrends = hasTrends
    ? trends!.weeklyTrends.map((t: any) => ({
        weekStart: t.weekStart || t.week || t.startDate || t.start || t.date || '',
        completionRate: t.completionRate ?? t.completion_rate ?? t.rate ?? 0,
        averageProgress: t.averageProgress ?? t.avgProgress ?? t.progress ?? 0,
        totalGoals: t.totalGoals ?? t.total ?? 0,
        completedGoals: t.completedGoals ?? t.completed ?? 0
      }))
    : [];

  const bestWeek = trends?.bestWeek || null;
  const worstWeek = trends?.worstWeek || null;
  const hasBestWeek = !!bestWeek && typeof bestWeek.completionRate === 'number';
  const hasWorstWeek = !!worstWeek && typeof worstWeek.completionRate === 'number';

  // Compact version
  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-600">{analytics.overallCompletionRate}%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-yellow-600">{analytics.performanceScore}</div>
            <div className="text-xs text-gray-600">Performance Score</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-purple-600">{analytics.streakCount}</div>
            <div className="text-xs text-gray-600">Week Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-600">{analytics.achievements.length}</div>
            <div className="text-xs text-gray-600">Achievements</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personal Analytics</h2>
          <p className="text-gray-600">
            {trends.volunteerName && `${trends.volunteerName}'s `}
            performance insights and progress tracking
          </p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'trends', 'productivity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-sm capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.overallCompletionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <Progress value={analytics.overallCompletionRate} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Performance Score</p>
                    <p className="text-2xl font-bold text-yellow-600">{analytics.performanceScore}</p>
                    <Badge className={`mt-1 ${performanceLevel.bg} ${performanceLevel.color} text-xs`}>
                      {performanceLevel.level}
                    </Badge>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-purple-600 flex items-center gap-1">
                      {analytics.streakCount}
                      <span className="text-lg">{getStreakIcon(analytics.streakCount)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">consecutive weeks</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievements</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.achievements.length}</p>
                    <p className="text-xs text-gray-500 mt-1">badges earned</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          {analytics.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.achievements.slice(0, 6).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(achievement.earnedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryStats.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-gray-600">
                          {category.completionRate}% ({category.totalGoals} goals)
                        </span>
                      </div>
                      <Progress value={category.completionRate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.productiveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completedGoals" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <>
          {/* Trend Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{trends.overallAverageProgress}%</div>
                <div className="text-sm text-gray-600">Overall Avg Progress</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{trends.overallCompletionRate}%</div>
                <div className="text-sm text-gray-600">Overall Completion Rate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">{trends.weeklyTrends.length}</div>
                <div className="text-sm text-gray-600">Weeks Tracked</div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Progress Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedWeeklyTrends.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No weekly trend data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={normalizedWeeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekStart"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        value ? new Date(value).toLocaleDateString() : ''
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        `Week of ${value ? new Date(value).toLocaleDateString() : ''}`
                      }
                      formatter={(value: any, name: string) => [
                        name === 'completionRate' ? `${value}%` : value,
                        name === 'completionRate'
                          ? 'Completion Rate'
                          : name === 'averageProgress'
                          ? 'Avg Progress'
                          : name === 'totalGoals'
                          ? 'Total Goals'
                          : 'Completed Goals'
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="completionRate"
                    />
                    <Line
                      type="monotone"
                      dataKey="averageProgress"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="averageProgress"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Best/Worst Week Analysis */}
          {(hasBestWeek || hasWorstWeek) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasBestWeek && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Best Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">
                        {bestWeek.completionRate}%
                      </p>
                      {bestWeek.weekStart && (
                        <p className="text-sm text-gray-600">
                          Week of {new Date(bestWeek.weekStart).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Your highest completion rate week
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasWorstWeek && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Improvement Opportunity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-orange-600">
                        {worstWeek.completionRate}%
                      </p>
                      {worstWeek.weekStart && (
                        <p className="text-sm text-gray-600">
                          Week of {new Date(worstWeek.weekStart).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Room for improvement from this week
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!hasBestWeek && !hasWorstWeek && (
            <Card>
              <CardContent className="text-center py-8 text-gray-500 text-sm">
                No best/worst week analytics available yet.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Productivity Tab */}
      {activeTab === 'productivity' && (
        <>
          {!hasProductivity && (
            <Card>
              <CardHeader>
                <CardTitle>Your Most Productive Day</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-10 text-gray-500">
                No productivity pattern data available yet.
              </CardContent>
            </Card>
          )}

          {hasProductivity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Your Most Productive Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {productivityData!.mostProductiveDay.dayName}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Most Productive Day</div>
                    <div className="text-lg font-semibold text-indigo-700">
                      Score: {productivityData!.mostProductiveDay.productivityScore}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Activities</span>
                      <span className="font-medium">{productivityData!.mostProductiveDay.activitiesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Goals Worked On</span>
                      <span className="font-medium">{productivityData!.mostProductiveDay.goalsWorkedOn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Progress</span>
                      <span className="font-medium">{productivityData!.mostProductiveDay.averageProgress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommended Days</h4>
                    <div className="flex flex-wrap gap-1">
                      {(productivityData!.recommendedWorkingDays || []).map((day) => (
                        <Badge key={day} variant="secondary" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly pattern */}
          {hasProductivity && Array.isArray(productivityData!.weeklyPattern) && productivityData!.weeklyPattern.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Productivity Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productivityData!.weeklyPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="productivityScore" fill="#8884d8" name="Productivity Score" />
                    <Bar dataKey="activitiesCount" fill="#82ca9d" name="Activities" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Productivity Insights */}
          {hasProductivity && Array.isArray(productivityData!.insights) && productivityData!.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Productivity Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productivityData!.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Insights and Recommendations */}
      {showInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Strengths</h4>
                <div className="space-y-2">
                  {analytics.overallCompletionRate >= 80 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">High completion rate</span>
                    </div>
                  )}
                  {analytics.streakCount >= 3 && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Consistent performance streak</span>
                    </div>
                  )}
                  {analytics.performanceScore >= 80 && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Excellent performance score</span>
                    </div>
                  )}
                  {analytics.achievements.length >= 5 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Achievement collector</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {analytics.overallCompletionRate < 70 && (
                    <p>• Focus on completing existing goals before taking on new ones</p>
                  )}
                  {analytics.streakCount < 2 && (
                    <p>• Try to maintain consistent weekly progress to build momentum</p>
                  )}
                  {hasProductivity && (
                    <p>• Schedule important tasks on {productivityData!.mostProductiveDay.dayName}s for best results</p>
                  )}
                  <p>• Continue your excellent progress and consider mentoring others</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalAnalytics;