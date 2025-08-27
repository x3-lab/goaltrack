import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Copy, Edit, Trash, Target, Clock, Tag, Search, Filter, BarChart3, TrendingUp, Users, Eye, Star, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Progress } from '../components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '../components/AdminLayout';
import { 
  goalTemplatesApi, 
  type GoalTemplateResponseDto, 
  type CreateGoalTemplateDto,
  type UpdateGoalTemplateDto,
  type GoalTemplateFiltersDto,
  type TemplateAnalyticsDto,
  type TemplateCategoryStatsDto,
  type TemplateUsageStatsDto
} from '../services/goalTemplatesApi';

interface GoalTemplateFormData {
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  status: 'active' | 'inactive';
}

interface AdminGoalTemplatesState {
  templates: GoalTemplateResponseDto[];
  analytics: TemplateAnalyticsDto | null;
  categoryStats: TemplateCategoryStatsDto[];
  categories: string[];
  loading: boolean;
  refreshing: boolean;
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

const AdminGoalTemplates: React.FC = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<AdminGoalTemplatesState>({
    templates: [],
    analytics: null,
    categoryStats: [],
    categories: [],
    loading: true,
    refreshing: false,
    totalPages: 1,
    currentPage: 1,
    totalItems: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplateResponseDto | null>(null);
  const [viewingUsageStats, setViewingUsageStats] = useState<GoalTemplateResponseDto | null>(null);
  const [usageStats, setUsageStats] = useState<TemplateUsageStatsDto | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<'templates' | 'analytics'>('templates');

  // Pagination
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    loadTemplatesData();
  }, [searchTerm, filterCategory, filterPriority, filterStatus, sortBy, sortOrder, state.currentPage]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab]);

  const loadTemplatesData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const filters: GoalTemplateFiltersDto = {
        search: searchTerm || undefined,
        category: filterCategory === 'all' ? undefined : filterCategory,
        priority: filterPriority === 'all' ? undefined : filterPriority,
        status: filterStatus === 'all' ? undefined : filterStatus,
        sortBy,
        sortOrder,
        page: state.currentPage,
        limit: itemsPerPage,
      };

      const [templatesResponse, categoriesData] = await Promise.all([
        goalTemplatesApi.getAll(filters),
        goalTemplatesApi.getCategories()
      ]);

      setState(prev => ({
        ...prev,
        templates: templatesResponse.templates,
        categories: categoriesData,
        totalPages: templatesResponse.totalPages,
        totalItems: templatesResponse.total,
        loading: false,
      }));

      console.log(`Loaded ${templatesResponse.templates.length} templates`);

    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load goal templates",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [searchTerm, filterCategory, filterPriority, filterStatus, sortBy, sortOrder, state.currentPage, itemsPerPage, toast]);

  const loadAnalyticsData = async () => {
    try {
      console.log('Loading template analytics...');
      
      const [analyticsData, categoryStatsData] = await Promise.all([
        goalTemplatesApi.getAnalytics(),
        goalTemplatesApi.getCategoryStats()
      ]);

      setState(prev => ({
        ...prev,
        analytics: analyticsData,
        categoryStats: categoryStatsData
      }));

      console.log('Template analytics loaded successfully');

    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load template analytics",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true }));
      await loadTemplatesData();
      if (activeTab === 'analytics') {
        await loadAnalyticsData();
      }
      toast({
        title: "Data Refreshed",
        description: "Template data has been updated.",
      });
    } catch (error) {
      // Error already handled in load functions
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  const handleCreateTemplate = async (templateData: GoalTemplateFormData) => {
    try {
      console.log('Creating new template...');
      
      const createData: CreateGoalTemplateDto = {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        priority: templateData.priority,
        defaultDuration: templateData.defaultDuration,
        tags: templateData.tags,
        status: templateData.status
      };

      await goalTemplatesApi.create(createData);
      await loadTemplatesData();
      setShowCreateModal(false);
      
      toast({
        title: "Template Created!",
        description: "Goal template created successfully",
      });

    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create goal template",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTemplate = async (templateData: GoalTemplateFormData) => {
    if (!editingTemplate) return;
    
    try {
      console.log(`Updating template ${editingTemplate.id}...`);
      
      const updateData: UpdateGoalTemplateDto = {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        priority: templateData.priority,
        defaultDuration: templateData.defaultDuration,
        tags: templateData.tags,
        status: templateData.status
      };

      await goalTemplatesApi.update(editingTemplate.id, updateData);
      await loadTemplatesData();
      setEditingTemplate(null);
      
      toast({
        title: "Template Updated!",
        description: "Goal template updated successfully",
      });

    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update goal template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      console.log(`Duplicating template ${templateId}...`);
      
      await goalTemplatesApi.duplicate(templateId);
      await loadTemplatesData();
      
      toast({
        title: "Template Duplicated!",
        description: "Goal template duplicated successfully",
      });

    } catch (error: any) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate goal template",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = state.templates.find(t => t.id === templateId);
    if (!template) return;

    const confirmMessage = `Are you sure you want to delete "${template.name}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log(`Deleting template ${templateId}...`);
      
      await goalTemplatesApi.delete(templateId);
      await loadTemplatesData();
      
      toast({
        title: "Template Deleted",
        description: "Goal template deleted successfully",
      });

    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal template",
        variant: "destructive"
      });
    }
  };

  const handleViewUsageStats = async (template: GoalTemplateResponseDto) => {
    try {
      setViewingUsageStats(template);
      console.log(`Loading usage stats for template ${template.id}...`);
      
      const stats = await goalTemplatesApi.getUsageStats(template.id);
      setUsageStats(stats);

    } catch (error: any) {
      console.error('Error loading usage stats:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load usage statistics",
        variant: "destructive"
      });
      setViewingUsageStats(null);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'category':
        setFilterCategory(value);
        break;
      case 'priority':
        setFilterPriority(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
    }
    setState(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setState(prev => ({ ...prev, currentPage: 1 }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTemplateCard = (template: GoalTemplateResponseDto) => (
    <Card key={template.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">{template.name}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{template.category}</Badge>
              {getStatusBadge(template.status)}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewUsageStats(template)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteTemplate(template.id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{template.defaultDuration} days</span>
            </div>
            <Badge variant="outline" className={getPriorityColor(template.priority)}>
              {template.priority}
            </Badge>
          </div>
          
          {(template.startDate || template.dueDate) && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {template.startDate && (
                <div className="flex items-center gap-1">
                  <span>Start:</span>
                  <span>{new Date(template.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {template.dueDate && (
                <div className="flex items-center gap-1">
                  <span>Due:</span>
                  <span>{new Date(template.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span>Used {template.usageCount} times</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">{template.createdByName}</span>
            </div>
          </div>

          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t">
            Created {formatDate(template.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTemplateTable = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                Created {sortBy === 'createdAt' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {template.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{template.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(template.priority)}>
                    {template.priority}
                  </Badge>
                </TableCell>
                <TableCell>{template.defaultDuration} days</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    {template.startDate && (
                      <div>Start: {new Date(template.startDate).toLocaleDateString()}</div>
                    )}
                    {template.dueDate && (
                      <div>Due: {new Date(template.dueDate).toLocaleDateString()}</div>
                    )}
                    {!template.startDate && !template.dueDate && (
                      <span className="text-gray-400">No dates set</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{template.usageCount}</TableCell>
                <TableCell>{getStatusBadge(template.status)}</TableCell>
                <TableCell>{formatDate(template.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewUsageStats(template)}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Goal Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable goal templates for volunteers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={state.refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${state.refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Goal Template</DialogTitle>
                </DialogHeader>
                <GoalTemplateForm onSubmit={handleCreateTemplate} categories={state.categories} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'templates' | 'analytics')}>
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates by name, description, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <Select value={filterCategory} onValueChange={(value) => handleFilterChange('category', value)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {state.categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={(value) => handleFilterChange('priority', value)}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Templates Content */}
            {state.loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-lg">Loading templates...</span>
              </div>
            ) : state.templates.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' 
                    ? 'No templates match your current filters.' 
                    : 'Get started by creating your first template.'}
                </p>
                {!searchTerm && filterCategory === 'all' && filterPriority === 'all' && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Template
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.templates.map(renderTemplateCard)}
                  </div>
                ) : (
                  renderTemplateTable()
                )}

                {/* Pagination */}
                {state.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((state.currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(state.currentPage * itemsPerPage, state.totalItems)} of {state.totalItems} templates
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                        disabled={state.currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                          let pageNum;
                          if (state.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (state.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (state.currentPage >= state.totalPages - 2) {
                            pageNum = state.totalPages - 4 + i;
                          } else {
                            pageNum = state.currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={state.currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setState(prev => ({ ...prev, currentPage: pageNum }))}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(state.totalPages, prev.currentPage + 1) }))}
                        disabled={state.currentPage === state.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <TemplateAnalytics 
              analytics={state.analytics} 
              categoryStats={state.categoryStats}
              loading={!state.analytics}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Template Modal */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Goal Template</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <GoalTemplateForm 
                template={editingTemplate} 
                onSubmit={handleUpdateTemplate} 
                categories={state.categories}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Usage Stats Modal */}
        <Dialog open={!!viewingUsageStats} onOpenChange={() => setViewingUsageStats(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Template Usage Analytics</DialogTitle>
            </DialogHeader>
            {viewingUsageStats && usageStats && (
              <TemplateUsageStatsView template={viewingUsageStats} stats={usageStats} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

// Goal Template Form Component
const GoalTemplateForm: React.FC<{
  template?: GoalTemplateResponseDto;
  onSubmit: (data: GoalTemplateFormData) => void;
  categories: string[];
}> = ({ template, onSubmit, categories }) => {
  const [formData, setFormData] = useState<GoalTemplateFormData>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'General',
    priority: template?.priority || 'Medium',
    defaultDuration: template?.defaultDuration || 7,
    startDate: template?.startDate || '',
    dueDate: template?.dueDate || '',
    tags: template?.tags || [],
    status: template?.status || 'active'
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (formData.defaultDuration < 1 || formData.defaultDuration > 365) {
      newErrors.defaultDuration = 'Duration must be between 1 and 365 days';
    }
    
    // Validate date fields
    if (formData.startDate && formData.dueDate) {
      const startDate = new Date(formData.startDate);
      const dueDate = new Date(formData.dueDate);
      if (startDate >= dueDate) {
        newErrors.dueDate = 'Due date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter template name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter template description"
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
              <SelectItem value="Community Service">Community Service</SelectItem>
              <SelectItem value="Professional Development">Professional Development</SelectItem>
              <SelectItem value="Fundraising">Fundraising</SelectItem>
              <SelectItem value="Mentorship">Mentorship</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value: 'High' | 'Medium' | 'Low') => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="duration">Default Duration (days) *</Label>
        <Input
          id="duration"
          type="number"
          value={formData.defaultDuration}
          onChange={(e) => setFormData(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) || 7 }))}
          min="1"
          max="365"
          className={errors.defaultDuration ? 'border-red-500' : ''}
        />
        {errors.defaultDuration && <p className="text-red-500 text-xs mt-1">{errors.defaultDuration}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date (optional)</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
        </div>
        
        <div>
          <Label htmlFor="dueDate">Due Date (optional)</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            className={errors.dueDate ? 'border-red-500' : ''}
          />
          {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <Button type="button" onClick={handleAddTag} variant="outline">
            <Tag className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.status === 'active'}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
          />
          <Label>Active Template</Label>
        </div>
        <Button type="submit">
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};

// Template Analytics Component
const TemplateAnalytics: React.FC<{
  analytics: TemplateAnalyticsDto | null;
  categoryStats: TemplateCategoryStatsDto[];
  loading: boolean;
}> = ({ analytics, categoryStats, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Analytics data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{analytics.totalTemplates}</p>
              <p className="text-sm text-gray-600">Total Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{analytics.activeTemplates}</p>
              <p className="text-sm text-gray-600">Active Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{analytics.totalUsage}</p>
              <p className="text-sm text-gray-600">Total Usage</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{analytics.avgUsagePerTemplate}</p>
              <p className="text-sm text-gray-600">Avg Usage/Template</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.mostUsed.map((template, index) => (
              <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{template.usageCount}</p>
                  <p className="text-xs text-gray-500">uses</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm text-gray-600">
                    {category.totalUsage} uses • {category.totalTemplates} templates
                  </span>
                </div>
                <Progress value={(category.totalUsage / analytics.totalUsage) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Template Usage Stats View Component
const TemplateUsageStatsView: React.FC<{
  template: GoalTemplateResponseDto;
  stats: TemplateUsageStatsDto;
}> = ({ template, stats }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <p className="text-sm text-gray-600">{template.description}</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
          <div className="text-sm text-gray-600">Total Usage</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.avgCompletionRate}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">#{stats.popularityRank}</div>
          <div className="text-sm text-gray-600">Popularity Rank</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.recentUsage}</div>
          <div className="text-sm text-gray-600">Recent Usage</div>
        </div>
      </div>

      {/* Monthly Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.monthlyUsage.map((month) => (
              <div key={`${month.year}-${month.month}`} className="flex items-center justify-between">
                <span className="text-sm font-medium">{month.month} {month.year}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{month.usageCount} uses</span>
                  <span className="text-sm text-gray-600">{month.completionRate}% completion</span>
                  <Progress value={month.completionRate} className="w-20 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Feedback */}
      {stats.userFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.userFeedback.map((feedback, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{feedback.userName}</span>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{feedback.feedback}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminGoalTemplates;