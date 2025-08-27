import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp,
  Award,
  Eye,
  X,
  RefreshCw,
  Search,
  Grid,
  List
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { progressHistoryApi, type VolunteerWeeklyHistoryDto, type HistoricalWeekDto } from '../services/progressHistoryApi';

interface ProgressHistoryProps {
  volunteerId?: string;
  onRefresh?: () => void;
  showAnalytics?: boolean;
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({ 
  volunteerId, 
  onRefresh, 
  showAnalytics = true 
}) => {
  const { toast } = useToast();
  
  // Simplified state management
  const [weeklyHistory, setWeeklyHistory] = useState<VolunteerWeeklyHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<HistoricalWeekDto | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadProgressHistory();
  }, [volunteerId]);

  const loadProgressHistory = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    
    try {
      console.log('Loading progress history...');
      
      if (!volunteerId) {
        throw new Error('Volunteer ID is required to load progress history');
      }
      
      const result = await progressHistoryApi.getVolunteerWeeklyHistory(volunteerId);
      setWeeklyHistory(result);
      console.log('Progress history loaded successfully');
      
    } catch (error: any) {
      console.error('Error loading progress history:', error);
      setError('Failed to load progress history');
      toast({
        title: "Error",
        description: "Failed to load progress history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadProgressHistory(true);
    if (onRefresh) onRefresh();
  };

  // Simplified filtering logic
  const filteredData = useMemo(() => {
    if (!weeklyHistory?.weeks) return [];
    
    return weeklyHistory.weeks.filter(week => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hasMatchingGoal = week.goals.some(goal => 
          goal.title.toLowerCase().includes(searchLower) ||
          goal.category.toLowerCase().includes(searchLower)
        );
        if (!hasMatchingGoal) return false;
      }
      
      return true;
    });
  }, [weeklyHistory, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWeekCompletionColor = (completionRate: number) => {
    if (completionRate >= 90) return 'bg-green-500';
    if (completionRate >= 75) return 'bg-blue-500';
    if (completionRate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedWeek(null);
  };

  const filteredGoalsInWeek = (week: HistoricalWeekDto) => {
    return week.goals.filter(goal => {
      const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
      return matchesStatus;
    });
  };

  const handleWeekSelect = (week: HistoricalWeekDto) => {
    setSelectedWeek(selectedWeek?.weekStart === week.weekStart ? null : week);
  };

  // Statistics calculation
  const overallStats = useMemo(() => {
    if (!weeklyHistory) return null;
    
    const totalWeeks = filteredData.length;
    const totalGoals = filteredData.reduce((sum, week) => sum + week.totalGoals, 0);
    const completedGoals = filteredData.reduce((sum, week) => sum + week.completedGoals, 0);
    const averageCompletionRate = totalWeeks > 0 
      ? Math.round(filteredData.reduce((sum, week) => sum + week.completionRate, 0) / totalWeeks)
      : 0;
    
    return {
      totalWeeks,
      totalGoals,
      completedGoals,
      averageCompletionRate
    };
  }, [filteredData, weeklyHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-lg font-medium mb-2">Unable to Load History</div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by goal title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-gray-200 bg-white">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-r"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {(searchTerm || statusFilter !== 'all') && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      {showAnalytics && overallStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-blue-700">{overallStats.totalWeeks}</p>
                <p className="text-xs text-blue-600">Total Weeks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="text-center">
                <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-purple-700">{overallStats.totalGoals}</p>
                <p className="text-xs text-purple-600">Total Goals</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-green-700">{overallStats.completedGoals}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-orange-700">{overallStats.averageCompletionRate}%</p>
                <p className="text-xs text-orange-600">Avg Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly History Content */}
      {filteredData.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
          {filteredData.map((week, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow border border-gray-200">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleWeekSelect(week)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-4 h-4 rounded-full ${getWeekCompletionColor(week.completionRate)}`}
                      title={`${week.completionRate}% completion rate`}
                    />
                    <div>
                      <CardTitle className="text-base">
                        {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {week.completedGoals} of {week.totalGoals} goals completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{week.completionRate}%</p>
                      <p className="text-xs text-gray-500">completion</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={week.completionRate} className="mt-3" />
              </CardHeader>

              {selectedWeek?.weekStart === week.weekStart && (
                <CardContent className="pt-0 border-t bg-gray-50">
                  <div className="space-y-4">
                    {/* Week Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{week.totalGoals}</div>
                        <div className="text-xs text-gray-600">Total Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{week.completedGoals}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{week.averageProgress}%</div>
                        <div className="text-xs text-gray-600">Avg Progress</div>
                      </div>
                    </div>

                    {/* Goals List */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Goals for this week:</h4>
                      {filteredGoalsInWeek(week).length > 0 ? (
                        <div className="space-y-2">
                          {filteredGoalsInWeek(week).map((goal) => (
                            <div key={goal.id} className="p-3 bg-white border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{goal.title}</h5>
                                  <p className="text-sm text-gray-600">{goal.category}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Badge variant="outline" className={getStatusColor(goal.status)}>
                                    {goal.status.replace('-', ' ')}
                                  </Badge>
                                  <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                                    {goal.priority}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
                              </div>
                              {goal.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-2 rounded">
                                  "{goal.notes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No goals match the current filters for this week.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Data Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters to see more results.' 
                : 'Start tracking goals to build your progress history.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <Button onClick={clearFilters} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressHistory;
