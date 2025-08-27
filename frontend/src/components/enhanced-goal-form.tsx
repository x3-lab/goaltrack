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
import { Goal } from '@/types/api';
import { type Volunteer } from '../services/usersApi';
import { type GoalResponseDto } from '../services/goalsApi';
import { 
  goalTemplatesApi, 
  type GoalTemplateResponseDto, 
  type GoalTemplate 
} from '../services/goalTemplatesApi';

export interface EnhancedGoalFormProps {
  onSubmit: (goalData: any) => Promise<void>;
  onCancel?: () => void;
  volunteerId?: string;
  initialData?: Partial<Goal>;
  goal?: GoalResponseDto;
  mode?: 'create' | 'edit';
  showTemplates?: boolean;
  volunteers?: Volunteer[];
  categories?: string[];
}

export const EnhancedGoalForm: React.FC<EnhancedGoalFormProps> = ({
  onSubmit,
  onCancel,
  volunteerId,
  initialData,
  goal,
  mode = 'create',
  showTemplates = true,
  volunteers = [],
  categories: categoriesProp
}) => {
  const { toast } = useToast();
  
  // Determine if this is admin mode (has volunteers list)
  const isAdminMode = volunteers.length > 0;
  
  const goalData = goal || initialData;
  
  const [formData, setFormData] = useState({
    title: goalData?.title || '',
    description: goalData?.description || '',
    priority: goalData?.priority || 'medium',
    category: goalData?.category || '',
    tags: goalData?.tags || [],
    startDate: goalData?.startDate
      ? goalData.startDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
    dueDate: goalData?.dueDate ? goalData.dueDate.split('T')[0] : '',
    volunteerId: goalData?.volunteerId || volunteerId || '',
    notes: goalData?.notes && Array.isArray(goalData.notes) ? goalData.notes[0] || '' : (goalData as any)?.notes || '',
    templateId: (goalData as any)?.templateId || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [templates, setTemplates] = useState<GoalTemplateResponseDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>(categoriesProp ?? []);

  const initializedRef = React.useRef(false);
  const loadedTemplatesRef = React.useRef(false);
  const loadedCategoriesRef = React.useRef(false);
  const abortRef = React.useRef(false);

  useEffect(() => () => { abortRef.current = true; }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      if (showTemplates && !goalData && mode === 'create' && !loadedTemplatesRef.current) {
        loadTemplates().finally(() => {
          loadedTemplatesRef.current = true;
        });
      }
      if (categoriesProp && categoriesProp.length > 0) {
        setAvailableCategories(categoriesProp);
        loadedCategoriesRef.current = true;
      } else if (!loadedCategoriesRef.current) {
        loadCategories().finally(() => {
          loadedCategoriesRef.current = true;
        });
      }
      initializedRef.current = true;
      return;
    }

    if (
      categoriesProp &&
      categoriesProp.length > 0 &&
      !loadedCategoriesRef.current
    ) {
      setAvailableCategories(categoriesProp);
      loadedCategoriesRef.current = true;
    }
  }, [
    showTemplates,
    mode,
    goalData ? true : false,
    categoriesProp ? categoriesProp.length : 0
  ]);

  const loadTemplates = async () => {
    if (loadedTemplatesRef.current) return;
    setLoadingTemplates(true);
    try {
      console.log('Loading goal templates...');
      
      // Get popular templates for quick access
      const popularTemplates = await goalTemplatesApi.getPopular(15);
      if (!abortRef.current) setTemplates(popularTemplates);
      
      console.log(`Loaded ${popularTemplates.length} templates`);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Warning",
        description: "Failed to load templates. You can still create goals manually.",
        variant: "destructive"
      });
    } finally {
      if (!abortRef.current) setLoadingTemplates(false);
    }
  };

  const loadCategories = async () => {
    if (loadedCategoriesRef.current) return;
    try {
      console.log('Loading template categories...');
      
      const categoryList = await goalTemplatesApi.getCategories();
      if (!abortRef.current) setAvailableCategories(categoryList);
      
      if (categoryList.length === 0) {
        setAvailableCategories([
          'Training',
          'Community Service',
          'Education',
          'Healthcare',
          'Environment',
          'Professional Development'
        ]);
      }
      console.log(`Loaded ${categoryList.length} categories`);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback categories
      if (!abortRef.current) {
        setAvailableCategories([
          'Training',
          'Community Service',
          'Education',
          'Healthcare',
          'Environment',
          'Professional Development'
        ]);
      }
    }
  };

  const validateForm = () => {
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

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (formData.startDate && formData.dueDate) {
      const s = new Date(formData.startDate);
      const d = new Date(formData.dueDate);
      if (s > d) newErrors.startDate = 'Start date cannot be after due date';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    // In admin mode, volunteer selection is required
    if (isAdminMode && !formData.volunteerId) {
      newErrors.volunteerId = 'Please select a volunteer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return formData.title.trim() && 
           formData.description.trim() && 
           formData.category.trim() && 
           formData.startDate &&
           formData.dueDate &&
           (!isAdminMode || formData.volunteerId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority.toLowerCase(),
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        volunteerId: isAdminMode ? formData.volunteerId : (volunteerId || formData.volunteerId),
        tags: formData.tags,
        notes: formData.notes && typeof formData.notes === 'string' && formData.notes.trim() ? [formData.notes.trim()] : undefined,
        progress: 0,
        templateId: formData.templateId || undefined // Include templateId if present
      };
      
      await onSubmit(goalData);
      
      toast({
        title: `Goal ${mode === 'edit' ? 'updated' : 'created'} successfully! 🎯`,
        description: `Goal "${formData.title}" has been ${mode === 'edit' ? 'updated' : 'created'} successfully`,
      });
      
      if (mode !== 'edit') {
        // Reset form for create mode
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          tags: [],
          startDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          volunteerId: isAdminMode ? '' : (volunteerId || ''),
          notes: '',
          templateId: ''
        });
        setErrors({});
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

  const applyTemplate = async (template: GoalTemplateResponseDto) => {
    try {
      console.log(`Applying template: ${template.name}`);
      
      let startDate = formData.startDate;
      let dueDate = formData.dueDate;
      
      if (template.startDate) {
        startDate = new Date(template.startDate).toISOString().split('T')[0];
      }
      
      if (template.dueDate) {
        dueDate = new Date(template.dueDate).toISOString().split('T')[0];
      } else if (template.defaultDuration && !template.dueDate) {
        // Calculate due date based on default duration if no template due date
        const calculatedDueDate = new Date(startDate);
        calculatedDueDate.setDate(calculatedDueDate.getDate() + template.defaultDuration);
        dueDate = calculatedDueDate.toISOString().split('T')[0];
      }
      
      setFormData(prev => ({
        ...prev,
        title: template.name,
        description: template.description,
        category: template.category,
        priority: template.priority,
        tags: [...template.tags],
        startDate: startDate,
        dueDate: dueDate,
        templateId: template.id
      }));

      console.log(`Template ${template.id} applied to form`);

      toast({
        title: "Template Applied!",
        description: `Applied template: ${template.name}${template.startDate || template.dueDate ? ' with template dates' : ''}`,
      });
      
      console.log(`Template applied successfully`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive"
      });
    }
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

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !templateSearch || 
      template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearch.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from templates for filtering
  const templateCategories = ['all', ...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      {showTemplates && !goalData && mode === 'create' && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Choose from Templates
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTemplates}
              disabled={loadingTemplates}
            >
              {loadingTemplates ? <LoadingSpinner size="sm" className="mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {loadingTemplates ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {/* Template Filters */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start hover:bg-blue-50"
                  onClick={() => applyTemplate(template)}
                  type="button"
                >
                  <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium truncate">{template.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {template.usageCount}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
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
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p id="category-error" className="text-sm text-red-500" role="alert">
                {errors.category}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: "high" | "low" | "medium") => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className={errors.startDate ? 'border-red-500' : ''}
              aria-describedby={errors.startDate ? 'startDate-error' : undefined}
            />
            {errors.startDate && (
              <p id="startDate-error" className="text-sm text-red-500" role="alert">
                {errors.startDate}
              </p>
            )}
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
              min={formData.startDate}
            />
            {errors.dueDate && (
              <p id="dueDate-error" className="text-sm text-red-500" role="alert">
                {errors.dueDate}
              </p>
            )}
          </div>

          {/* Volunteer Selection - Only in Admin Mode */}
          {isAdminMode && (
            <div className="space-y-2">
              <Label htmlFor="volunteerId">Assign to Volunteer *</Label>
              <Select 
                value={formData.volunteerId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, volunteerId: value }))}
              >
                <SelectTrigger className={errors.volunteerId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.map(volunteer => (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      {volunteer.name} ({volunteer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.volunteerId && (
                <p id="volunteerId-error" className="text-sm text-red-500" role="alert">
                  {errors.volunteerId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or instructions"
            rows={2}
          />
        </div>

        {/* Submit Buttons */}
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