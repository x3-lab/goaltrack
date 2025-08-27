import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import AddVolunteerForm from '../components/AddVolunteerForm';
import { usersApi, type Volunteer, type UserFilters } from '../services/usersApi';
import type { PaginatedResponse } from '../types/api';

const AdminVolunteerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'joinDate' | 'lastActivity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadVolunteers();
  }, [searchTerm, statusFilter, sortBy, sortOrder, currentPage]);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const filters: UserFilters = {
        role: 'volunteer',
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response: PaginatedResponse<Volunteer> = await usersApi.getAllPaginated(filters);
      
      setVolunteers(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      
      console.log(`Loaded ${response.data.length} volunteers`);
    } catch (error: any) {
      console.error('Error loading volunteers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load volunteers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleSelectVolunteer = (volunteerId: string, selected: boolean) => {
    if (selected) {
      setSelectedVolunteers(prev => [...prev, volunteerId]);
    } else {
      setSelectedVolunteers(prev => prev.filter(id => id !== volunteerId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedVolunteers(volunteers.map(v => v.id));
    } else {
      setSelectedVolunteers([]);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedVolunteers.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select volunteers to perform bulk actions",
        variant: "destructive"
      });
      return;
    }

    const actionText = action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'delete';
    const confirmMessage = `Are you sure you want to ${actionText} ${selectedVolunteers.length} volunteer(s)?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      switch (action) {
        case 'activate':
          await usersApi.bulkUpdateStatus(selectedVolunteers, 'active');
          toast({
            title: "Success",
            description: `${selectedVolunteers.length} volunteers activated`,
          });
          break;
        case 'deactivate':
          await usersApi.bulkUpdateStatus(selectedVolunteers, 'inactive');
          toast({
            title: "Success",
            description: `${selectedVolunteers.length} volunteers deactivated`,
          });
          break;
        case 'delete':
          await usersApi.bulkDelete(selectedVolunteers);
          toast({
            title: "Success",
            description: `${selectedVolunteers.length} volunteers deleted`,
          });
          break;
      }
      
      setSelectedVolunteers([]);
      await loadVolunteers();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (volunteerId: string) => {
    navigate(`/admin-dashboard/volunteers/${volunteerId}`);
  };

  const handleEditVolunteer = (volunteerId: string) => {
    navigate(`/admin-dashboard/volunteers/${volunteerId}?edit=true`);
  };

  const handleDeleteVolunteer = async (volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return;

    const confirmMessage = `Are you sure you want to delete ${volunteer.name}? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await usersApi.delete(volunteerId);
      await loadVolunteers();
      toast({
        title: "Success",
        description: "Volunteer deleted successfully",
      });
    } catch (error: any) {
      console.error('Delete volunteer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete volunteer",
        variant: "destructive"
      });
    }
  };

  const handleStatusToggle = async (volunteerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await usersApi.updateStatus(volunteerId, newStatus);
      await loadVolunteers();
      toast({
        title: "Success",
        description: `Volunteer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Status toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update volunteer status",
        variant: "destructive"
      });
    }
  };

  const handleVolunteerAdded = async (newVolunteer: Volunteer) => {
    setShowAddForm(false);
    await loadVolunteers();
    toast({
      title: "Success",
      description: "Volunteer added successfully",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (showAddForm) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Volunteer</h1>
              <p className="text-muted-foreground">Create a new volunteer account</p>
            </div>
            <Button variant="outline" onClick={() => setShowAddForm(false)} className="w-full sm:w-auto">
              Back to List
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <AddVolunteerForm onSuccess={handleVolunteerAdded} />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Volunteer Management</h1>
            <p className="text-muted-foreground">
              Manage volunteer accounts, roles, and permissions
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2 w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            Add Volunteer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">volunteers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {volunteers.filter(v => v.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">online</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {volunteers.filter(v => v.status === 'inactive').length}
              </div>
              <p className="text-xs text-muted-foreground">offline</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {selectedVolunteers.length}
              </div>
              <p className="text-xs text-muted-foreground">chosen</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search volunteers by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as typeof sortOrder);
                }}>
                  <SelectTrigger className="sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                    <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                    <SelectItem value="joinDate-desc">Newest First</SelectItem>
                    <SelectItem value="joinDate-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedVolunteers.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="text-sm text-muted-foreground">
                  {selectedVolunteers.length} volunteer(s) selected
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Deactivate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Volunteers Table/Cards */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-2 text-muted-foreground">Loading volunteers...</span>
              </div>
            ) : volunteers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No volunteers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No volunteers match your current filters.' 
                    : 'Get started by adding your first volunteer.'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setShowAddForm(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add First Volunteer
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedVolunteers.length === volunteers.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('name')}
                        >
                          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('email')}
                        >
                          Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('joinDate')}
                        >
                          Join Date {sortBy === 'joinDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Goals</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {volunteers.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedVolunteers.includes(volunteer.id)}
                              onCheckedChange={(checked) => 
                                handleSelectVolunteer(volunteer.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="font-medium">{volunteer.name}</div>
                          </TableCell>
                          <TableCell>{volunteer.email}</TableCell>
                          <TableCell>{volunteer.phone || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(volunteer.status)}</TableCell>
                          <TableCell>{formatDate(volunteer.joinDate || volunteer.createdAt)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{volunteer.goals || 0} total</div>
                              <div className="text-muted-foreground">
                                {volunteer.completedGoals || 0} completed
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(volunteer.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditVolunteer(volunteer.id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleStatusToggle(volunteer.id, volunteer.status)}
                                >
                                  {volunteer.status === 'active' ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteVolunteer(volunteer.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 p-4">
                  {volunteers.map((volunteer) => (
                    <Card key={volunteer.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedVolunteers.includes(volunteer.id)}
                              onCheckedChange={(checked) => 
                                handleSelectVolunteer(volunteer.id, checked as boolean)
                              }
                            />
                            <div>
                              <h3 className="font-semibold text-lg text-left">{volunteer.name}</h3>
                              <p className="text-sm text-muted-foreground text-left">{volunteer.email}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(volunteer.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditVolunteer(volunteer.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleStatusToggle(volunteer.id, volunteer.status)}
                              >
                                {volunteer.status === 'active' ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteVolunteer(volunteer.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status</span>
                            {getStatusBadge(volunteer.status)}
                          </div>
                          
                          {volunteer.phone && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Phone</span>
                              <span className="text-sm">{volunteer.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Joined</span>
                            <span className="text-sm">{formatDate(volunteer.joinDate || volunteer.createdAt)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Goals</span>
                            <div className="text-sm text-right">
                              <div>{volunteer.goals || 0} total</div>
                              <div className="text-muted-foreground text-xs">
                                {volunteer.completedGoals || 0} completed
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} volunteers
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              {/* Desktop Pagination */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              {/* Mobile Pagination - Simple */}
              <div className="sm:hidden flex items-center gap-2">
                <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                  {currentPage} / {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVolunteerManagement;