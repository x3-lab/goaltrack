import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Filter, 
  UserPlus, 
  Download, 
  Mail, 
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { api, type Volunteer } from '../services/api';
import { adminApi } from '../services/adminApi';
import AddVolunteerForm from '../components/AddVolunteerForm';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { SkeletonTable } from '../components/ui/skeleton-loader';

const AdminVolunteerManagement: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    performance: 'all',
    role: 'all'
  });

  useEffect(() => {
    loadVolunteers();
  }, []);

  useEffect(() => {
    filterVolunteers();
  }, [volunteers, searchTerm, filters]);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const volunteerData = await api.volunteers.getAll();
      setVolunteers(volunteerData);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      toast({
        title: "Error",
        description: "Failed to load volunteers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVolunteers = () => {
    let filtered = volunteers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(volunteer => 
        volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(volunteer => volunteer.status === filters.status);
    }

    // Apply performance filter
    if (filters.performance !== 'all') {
      filtered = filtered.filter(volunteer => volunteer.performance === filters.performance);
    }

    // Apply role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(volunteer => volunteer.role === filters.role);
    }

    setFilteredVolunteers(filtered);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedVolunteers.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select volunteers first",
        variant: "destructive"
      });
      return;
    }

    try {
      switch (action) {
        case 'export-data':
          await adminApi.exportVolunteerData(selectedVolunteers);
          toast({
            title: "Success",
            description: "Volunteer data exported successfully",
          });
          break;
        case 'activate':
          await Promise.all(selectedVolunteers.map(id => 
            api.volunteers.update(id, { status: 'active' })
          ));
          await loadVolunteers();
          toast({
            title: "Success",
            description: `${selectedVolunteers.length} volunteers activated`,
          });
          break;
        case 'deactivate':
          await Promise.all(selectedVolunteers.map(id => 
            api.volunteers.update(id, { status: 'inactive' })
          ));
          await loadVolunteers();
          toast({
            title: "Success",
            description: `${selectedVolunteers.length} volunteers deactivated`,
          });
          break;
      }
      setSelectedVolunteers([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (volunteerId: string) => {
    navigate(`/admin-dashboard/volunteers/${volunteerId}`);
  };

  const handleDeleteVolunteer = async (volunteerId: string) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await api.volunteers.delete(volunteerId);
        await loadVolunteers();
        toast({
          title: "Success",
          description: "Volunteer deleted successfully",
        });
      } catch (error) {
        console.error('Delete error:', error);
        toast({
          title: "Error",
          description: "Failed to delete volunteer",
          variant: "destructive"
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVolunteers(filteredVolunteers.map(v => v.id));
    } else {
      setSelectedVolunteers([]);
    }
  };

  const handleSelectVolunteer = (volunteerId: string, checked: boolean) => {
    if (checked) {
      setSelectedVolunteers(prev => [...prev, volunteerId]);
    } else {
      setSelectedVolunteers(prev => prev.filter(id => id !== volunteerId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
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

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Add New Volunteer</h1>
          <Button variant="outline" onClick={() => setShowAddForm(false)}>
            Cancel
          </Button>
        </div>
        <AddVolunteerForm 
          onSuccess={() => {
            setShowAddForm(false);
            loadVolunteers();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your volunteer team performance.</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Volunteer
        </Button>
      </div>

      {/* Statistics Section */}
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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search volunteers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.performance} onValueChange={(value) => setFilters(prev => ({...prev, performance: value}))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({...prev, role: value}))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedVolunteers.length > 0 && (
            <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{selectedVolunteers.length} volunteers selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export-data')}>
                <Download className="h-4 w-4 mr-1" />
                Export Data
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                <XCircle className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volunteers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Directory ({filteredVolunteers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Checkbox 
                      checked={selectedVolunteers.length === filteredVolunteers.length && filteredVolunteers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Goals</th>
                  <th className="text-left p-2">Performance</th>
                  <th className="text-left p-2">Join Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.map((volunteer) => (
                  <tr key={volunteer.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Checkbox 
                        checked={selectedVolunteers.includes(volunteer.id)}
                        onCheckedChange={(checked) => handleSelectVolunteer(volunteer.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-2 font-medium">{volunteer.name}</td>
                    <td className="p-2 text-gray-600">{volunteer.email}</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(volunteer.status)}>
                        {volunteer.status}
                      </Badge>
                    </td>
                    <td className="p-2">{volunteer.role}</td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div>{volunteer.goalsCount} total</div>
                        <div className="text-gray-500">{volunteer.completionRate}% complete</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getPerformanceColor(volunteer.performance)}>
                        {volunteer.performance}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {new Date(volunteer.joinDate).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleViewDetails(volunteer.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin-dashboard/volunteers/${volunteer.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteVolunteer(volunteer.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVolunteers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No volunteers found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVolunteerManagement;