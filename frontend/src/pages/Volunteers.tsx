
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SkeletonTable } from '../components/ui/skeleton-loader';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Award, 
  Mail,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  goalsCount: number;
  completionRate: number;
  status: 'active' | 'inactive';
  lastActive: string;
  performance: 'high' | 'medium' | 'low';
}

const Volunteers: React.FC = () => {
  const { toast } = useToast();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterPerformance, setFilterPerformance] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Mock data
  useEffect(() => {
    const loadVolunteers = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setVolunteers([
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          role: 'Senior Volunteer',
          joinDate: '2024-01-15',
          goalsCount: 12,
          completionRate: 95,
          status: 'active',
          lastActive: '2024-07-08',
          performance: 'high'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          role: 'Volunteer',
          joinDate: '2024-02-20',
          goalsCount: 8,
          completionRate: 88,
          status: 'active',
          lastActive: '2024-07-07',
          performance: 'high'
        },
        {
          id: '3',
          name: 'Emma Davis',
          email: 'emma.davis@email.com',
          role: 'Volunteer',
          joinDate: '2024-03-10',
          goalsCount: 6,
          completionRate: 75,
          status: 'active',
          lastActive: '2024-07-06',
          performance: 'medium'
        },
        {
          id: '4',
          name: 'David Wilson',
          email: 'david.wilson@email.com',
          role: 'Volunteer',
          joinDate: '2024-04-05',
          goalsCount: 4,
          completionRate: 60,
          status: 'inactive',
          lastActive: '2024-06-28',
          performance: 'low'
        },
        {
          id: '5',
          name: 'Lisa Anderson',
          email: 'lisa.anderson@email.com',
          role: 'Team Lead',
          joinDate: '2024-01-08',
          goalsCount: 15,
          completionRate: 92,
          status: 'active',
          lastActive: '2024-07-08',
          performance: 'high'
        }
      ]);
      setLoading(false);
    };

    loadVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || volunteer.status === filterStatus;
    const matchesPerformance = filterPerformance === 'all' || volunteer.performance === filterPerformance;
    
    return matchesSearch && matchesStatus && matchesPerformance;
  });

  const handleSendReminder = (volunteer: Volunteer) => {
    toast({
      title: "Reminder Sent",
      description: `Reminder sent to ${volunteer.name}`,
    });
  };

  const handleViewProfile = (volunteer: Volunteer) => {
    toast({
      title: "Profile View",
      description: `Opening profile for ${volunteer.name}`,
    });
    // Navigate to volunteer profile
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  const getPerformanceBadge = (performance: string) => {
    const variants = {
      high: { className: 'bg-green-100 text-green-800', text: 'High Performer' },
      medium: { className: 'bg-yellow-100 text-yellow-800', text: 'Good' },
      low: { className: 'bg-red-100 text-red-800', text: 'Needs Support' }
    };
    
    const variant = variants[performance as keyof typeof variants];
    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
  const avgCompletionRate = volunteers.length > 0 
    ? Math.round(volunteers.reduce((sum, v) => sum + v.completionRate, 0) / volunteers.length)
    : 0;
  const highPerformers = volunteers.filter(v => v.performance === 'high').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Volunteer Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage your volunteer team performance.</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              out of {volunteers.length} total volunteers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">across all volunteers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPerformers}</div>
            <p className="text-xs text-muted-foreground">volunteers excelling</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Directory</CardTitle>
          <CardDescription>Search and filter volunteers by status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search volunteers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Performance</option>
                <option value="high">High Performers</option>
                <option value="medium">Good</option>
                <option value="low">Needs Support</option>
              </select>
            </div>
          </div>

          {/* Volunteers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{volunteer.name}</div>
                        <div className="text-sm text-gray-500">{volunteer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{volunteer.role}</TableCell>
                    <TableCell>{getStatusBadge(volunteer.status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{volunteer.goalsCount} goals</div>
                        <div className="text-sm text-gray-500">{volunteer.completionRate}% completed</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPerformanceBadge(volunteer.performance)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(volunteer.lastActive).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProfile(volunteer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendReminder(volunteer)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVolunteers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No volunteers found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Volunteers;