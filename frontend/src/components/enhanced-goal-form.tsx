
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Copy, Bookmark } from 'lucide-react';

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface EnhancedGoalFormProps {
  onSubmit: (goal: any) => Promise<void>;
  initialData?: any;
  templates?: GoalTemplate[];
}

const goalTemplates: GoalTemplate[] = [
  {
    id: '1',
    name: 'Community Outreach',
    description: 'Organize and participate in community outreach activities',
    category: 'Community Service',
    priority: 'High'
  },
  {
    id: '2',
    name: 'Training Session',
    description: 'Complete required training or certification',
    category: 'Training & Development',
    priority: 'Medium'
  },
  {
    id: '3',
    name: 'Team Meeting',
    description: 'Attend scheduled team meeting and provide updates',
    category: 'Team Activities',
    priority: 'Medium'
  }
];

export const EnhancedGoalForm: React.FC<EnhancedGoalFormProps> = ({
  onSubmit,
  initialData,
  templates = goalTemplates
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Goal title must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Goal description is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: `Goal ${initialData ? 'updated' : 'created'} successfully`,
      });
      
      if (!initialData) {
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
        description: `Failed to ${initialData ? 'update' : 'create'} goal`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: GoalTemplate) => {
    setFormData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      category: template.category,
      priority: template.priority
    }));
    toast({
      title: "Template Applied",
      description: `Applied template: ${template.name}`,
    });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {initialData ? 'Edit Goal' : 'Create New Goal'}
          {initialData && (
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
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!initialData && (
          <div className="space-y-3">
            <Label>Goal Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="flex items-center gap-2 h-auto p-3 text-left"
                >
                  <Bookmark className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.category}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

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
                placeholder="e.g., Community Service"
                className={errors.category ? 'border-red-500' : ''}
              />
              {errors.category && (
                <p className="text-sm text-red-500" role="alert">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
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

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
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
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : null}
            {initialData ? 'Update Goal' : 'Create Goal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};