import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  Target, 
  TrendingUp,
  Award,
  Eye,
  CalendarDays,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { type HistoricalWeek } from '../services/api';

interface ProgressHistoryProps {
  historicalData: HistoricalWeek[];
  onRefresh?: () => void;
  volunteerId?: string;
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({ historicalData, onRefresh, volunteerId }) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<HistoricalWeek | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState<Date>();
  const [dateRangeEnd, setDateRangeEnd] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Enhanced filtering logic
  const filteredData = useMemo(() => {
    return historicalData.filter(week => {
      const weekStart = new Date(week.weekStart);
      const weekEnd = new Date(week.weekEnd);
      
      // Date range filter
      if (dateRangeStart && weekStart < dateRangeStart) return false;
      if (dateRangeEnd && weekEnd > dateRangeEnd) return false;
      
      // Single date filter
      if (selectedDate && !(selectedDate >= weekStart && selectedDate <= weekEnd)) return false;
      
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
  }, [historicalData, selectedDate, dateRangeStart, dateRangeEnd, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWeekHighlightColor = (completionRate: number) => {
    if (completionRate === 100) return 'bg-green-500';
    if (completionRate >= 75) return 'bg-blue-500';
    if (completionRate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const clearAllFilters = () => {
    setSelectedDate(undefined);
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchTerm('');
  };

  const filteredGoalsInWeek = (week: HistoricalWeek) => {
    return week.goals.filter(goal => {
      const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || goal.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  };

  const handleWeekSelect = (week: HistoricalWeek) => {
    setSelectedWeek(selectedWeek?.weekStart === week.weekStart ? null : week);
  };

  // Statistics calculation
  const overallStats = useMemo(() => {
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
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                Calendar View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by goal title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date Filters */}
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start min-w-[140px]">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedDate ? selectedDate.toLocaleDateString() : "Single Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
                {selectedDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(undefined)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start min-w-[140px]">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRangeStart ? dateRangeStart.toLocaleDateString() : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRangeStart}
                  onSelect={setDateRangeStart}
                />
                {dateRangeStart && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRangeStart(undefined)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Start Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start min-w-[140px]">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRangeEnd ? dateRangeEnd.toLocaleDateString() : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRangeEnd}
                  onSelect={setDateRangeEnd}
                />
                {dateRangeEnd && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRangeEnd(undefined)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear End Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Display */}
          {(selectedDate || dateRangeStart || dateRangeEnd || searchTerm) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedDate && (
                <Badge variant="secondary" className="gap-1">
                  Date: {selectedDate.toLocaleDateString()}
                  <button onClick={() => setSelectedDate(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {dateRangeStart && (
                <Badge variant="secondary" className="gap-1">
                  From: {dateRangeStart.toLocaleDateString()}
                  <button onClick={() => setDateRangeStart(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {dateRangeEnd && (
                <Badge variant="secondary" className="gap-1">
                  To: {dateRangeEnd.toLocaleDateString()}
                  <button onClick={() => setDateRangeEnd(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                Refresh Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{overallStats.totalWeeks}</p>
              <p className="text-sm text-gray-600">Total Weeks</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{overallStats.totalGoals}</p>
              <p className="text-sm text-gray-600">Total Goals</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{overallStats.completedGoals}</p>
              <p className="text-sm text-gray-600">Completed Goals</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{overallStats.averageCompletionRate}%</p>
              <p className="text-sm text-gray-600">Avg Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <p className="text-sm text-gray-600">
              Weeks with goal activity are highlighted. Click on any week to see details.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredData.map((week, index) => (
                <div key={index} className="border rounded-lg">
                  <div 
                    className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-t-lg cursor-pointer"
                    onClick={() => handleWeekSelect(week)}
                  >
                    <div className={`w-3 h-3 rounded-full ${getWeekHighlightColor(week.completionRate)}`} />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {week.totalGoals} goals
                        </span>
                        <span className="text-xs text-gray-500">
                          {week.completedGoals} completed
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {week.completionRate}% completion
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={week.completionRate} className="w-16" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeekSelect(week);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Week Details - Same as List View */}
                  {selectedWeek?.weekStart === week.weekStart && (
                    <div className="border-t p-4">
                      <div className="space-y-4">
                        {/* Week Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{week.totalGoals}</div>
                            <div className="text-sm text-gray-600">Total Goals</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{week.completedGoals}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{week.averageProgress}%</div>
                            <div className="text-sm text-gray-600">Avg Progress</div>
                          </div>
                        </div>

                        {/* Goals List */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Goals for this week:</h4>
                          {filteredGoalsInWeek(week).map((goal) => (
                            <div key={goal.id} className="p-3 bg-white border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium">{goal.title}</h5>
                                  <p className="text-sm text-gray-600">{goal.category}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge className={getStatusColor(goal.status)}>
                                    {goal.status}
                                  </Badge>
                                  <Badge className={getPriorityColor(goal.priority)}>
                                    {goal.priority}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{goal.progress}%</span>
                              </div>
                              {goal.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">{goal.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-4">
          {filteredData.map((week, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader 
                className="pb-3"
                onClick={() => handleWeekSelect(week)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Week of {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600">
                        {week.totalGoals} goals
                      </span>
                      <span className="text-sm text-gray-600">
                        {week.completedGoals} completed
                      </span>
                      <span className="text-sm font-medium">
                        {week.completionRate}% completion rate
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={week.completionRate} className="w-20" />
                    <div className={`w-3 h-3 rounded-full ${getWeekHighlightColor(week.completionRate)}`} />
                    {selectedWeek?.weekStart === week.weekStart ? 
                      <ChevronLeft className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </div>
                </div>
              </CardHeader>

              {selectedWeek?.weekStart === week.weekStart && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Week Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{week.totalGoals}</div>
                        <div className="text-sm text-gray-600">Total Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{week.completedGoals}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{week.averageProgress}%</div>
                        <div className="text-sm text-gray-600">Avg Progress</div>
                      </div>
                    </div>

                    {/* Goals List */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Goals for this week:</h4>
                      {filteredGoalsInWeek(week).map((goal) => (
                        <div key={goal.id} className="p-3 bg-white border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium">{goal.title}</h5>
                              <p className="text-sm text-gray-600">{goal.category}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(goal.status)}>
                                {goal.status}
                              </Badge>
                              <Badge className={getPriorityColor(goal.priority)}>
                                {goal.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{goal.progress}%</span>
                          </div>
                          {goal.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{goal.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {filteredData.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg mb-2">No historical data found</p>
            <p className="text-gray-400">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressHistory;