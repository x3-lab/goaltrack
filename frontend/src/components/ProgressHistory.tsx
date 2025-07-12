
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface HistoricalWeek {
  weekStart: string;
  weekEnd: string;
  goals: Array<{
    id: number;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    progress: number;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  completionRate: number;
}

interface ProgressHistoryProps {
  historicalData: HistoricalWeek[];
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({ historicalData }) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<HistoricalWeek | null>(null);

  const filteredData = historicalData.filter(week => {
    if (selectedDate) {
      const weekStart = new Date(week.weekStart);
      const weekEnd = new Date(week.weekEnd);
      return selectedDate >= weekStart && selectedDate <= weekEnd;
    }
    return true;
  });

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedDate(undefined);
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Historical Weeks */}
      <div className="grid gap-4">
        {filteredData.map((week, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader 
              className="pb-3"
              onClick={() => setSelectedWeek(selectedWeek?.weekStart === week.weekStart ? null : week)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Week of {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {week.goals.length} goals • {week.completionRate}% completion rate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${week.completionRate === 100 ? 'bg-green-500' : week.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  {selectedWeek?.weekStart === week.weekStart ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>

            {selectedWeek?.weekStart === week.weekStart && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {week.goals
                    .filter(goal => statusFilter === 'all' || goal.status === statusFilter)
                    .map((goal) => (
                      <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{goal.title}</h4>
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
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No historical data found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressHistory;