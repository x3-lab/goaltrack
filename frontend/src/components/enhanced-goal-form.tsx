import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Copy, Bookmark, Search, Target } from 'lucide-react';
import { api, GoalTemplate } from '../services/api';
import { Goal } from '@/types/api';

export interface EnhancedGoalFormProps {
  onSubmit: (goalData: any) => Promise<void>;
  onCancel?: () => void; // Now optional
  volunteerId?: string;
  initialData?: Partial<Goal>;
  mode?: 'create' | 'edit';
  showTemplates?: boolean;
}

export const EnhancedGoalForm: React.FC<EnhancedGoalFormProps> = ({
  onSubmit,
  onCancel,
  volunteerId,
  initialData,
  mode = 'create',
  showTemplates = true
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'Medium',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    dueDate: initialData?.dueDate || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (showTemplates && !initialData) {
      loadTemplates();
      loadCategories();
    }
  }, [showTemplates, initialData]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await api.goalTemplates.getPopular(15);
      setTemplates(result);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.goalTemplates.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = templateSearch === '' || 
      template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearch.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return formData.title.trim() !== '' && 
           formData.description.trim() !== '' && 
           formData.category.trim() !== '' && 
           formData.dueDate !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        ...formData,
        volunteer: volunteerId || undefined
      };
      
      await onSubmit(goalData);
      
      toast({
        title: `Goal ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        description: `Goal ${mode === 'edit' ? 'updated' : 'created'} successfully`,
      });
      
      if (mode !== 'edit') {
        setFormData({
          title: '',
          description: '',
          priority: 'Medium',
          category: '',
          tags: [],
          dueDate: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode === 'edit' ? 'update' : 'create'} goal`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (template: GoalTemplate) => {
    // Calculate default due date based on template duration
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.defaultDuration);
    
    setFormData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      category: template.category,
      priority: template.priority,
      tags: [...template.tags],
      dueDate: dueDate.toISOString().split('T')[0]
    }));
    
    toast({
      title: "Template Applied",
      description: `Applied template: ${template.name}`,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const duplicateGoal = () => {
    if (initialData) {
      setFormData({
        ...formData,
        title: `${formData.title} (Copy)`
      });
      toast({
        title: "Goal Duplicated",
        description: "Goal has been duplicated for editing",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with duplicate button for editing */}
      {mode === 'edit' && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Goal</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={duplicateGoal}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
        </div>
      )}

      {/* Goal Templates */}
      {mode !== 'edit' && showTemplates && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">Quick Start Templates</Label>
          
          {/* Template Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Grid */}
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="flex flex-col items-start gap-2 h-auto p-3 text-left justify-start hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Bookmark className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.category}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.usageCount}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 w-full text-left">
                    {template.description}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}

          {filteredTemplates.length === 0 && !loadingTemplates && (
            <div className="text-center py-8 text-gray-500">
              <Bookmark className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No templates found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Goal Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter goal title"
            className={errors.title ? 'border-red-500' : ''}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-red-500" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the goal in detail"
            className={errors.description ? 'border-red-500' : ''}
            aria-describedby={errors.description ? 'description-error' : undefined}
            rows={3}
          />
          {errors.description && (
            <p id="description-error" className="text-sm text-red-500" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Training, Community Service"
              className={errors.category ? 'border-red-500' : ''}
              aria-describedby={errors.category ? 'category-error' : undefined}
            />
            {errors.category && (
              <p id="category-error" className="text-sm text-red-500" role="alert">
                {errors.category}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                {tag} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            className={errors.dueDate ? 'border-red-500' : ''}
            aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
          />
          {errors.dueDate && (
            <p id="dueDate-error" className="text-sm text-red-500" role="alert">
              {errors.dueDate}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={loading || !isFormValid()}
            className="flex-1"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {mode === 'edit' ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Update Goal' : 'Create Goal'}
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};