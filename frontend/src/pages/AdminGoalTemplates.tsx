import React, { useState, useEffect } from 'react';
import { Plus, Copy, Edit, Trash, Target, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adminApi, GoalTemplate } from '../services/adminApi';
import { LoadingSpinner } from '../components/ui/loading-spinner';

interface GoalTemplateFormData {
  name: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  defaultDuration: number;
  tags: string[];
  isActive: boolean;
}

const AdminGoalTemplates: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templatesData = await adminApi.getGoalTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load goal templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: GoalTemplateFormData) => {
    try {
      await adminApi.createGoalTemplate(templateData);
      await loadTemplates();
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Goal template created successfully",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create goal template",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTemplate = async (templateData: GoalTemplateFormData) => {
    if (!editingTemplate) return;
    
    try {
      await adminApi.updateGoalTemplate(editingTemplate.id, templateData);
      await loadTemplates();
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Goal template updated successfully",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update goal template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await adminApi.duplicateGoalTemplate(templateId);
      await loadTemplates();
      toast({
        title: "Success",
        description: "Goal template duplicated successfully",
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate goal template",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await adminApi.deleteGoalTemplate(templateId);
        await loadTemplates();
        toast({
          title: "Success",
          description: "Goal template deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error",
          description: "Failed to delete goal template",
          variant: "destructive"
        });
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goal Templates</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Goal Template</DialogTitle>
            </DialogHeader>
            <GoalTemplateForm onSubmit={handleCreateTemplate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{template.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDuplicateTemplate(template.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Goal Template</DialogTitle>
                      </DialogHeader>
                      <GoalTemplateForm 
                        template={template} 
                        onSubmit={handleUpdateTemplate} 
                      />
                    </DialogContent>
                  </Dialog>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{template.defaultDuration} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Used {template.usageCount} times</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={getPriorityColor(template.priority)}>
                    {template.priority}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs text-gray-500">
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg mb-2">No goal templates found</p>
          <p className="text-gray-400">Create your first template to get started</p>
        </div>
      )}
    </div>
  );
};

// Goal Template Form Component
const GoalTemplateForm: React.FC<{
  template?: GoalTemplate;
  onSubmit: (data: GoalTemplateFormData) => void;
}> = ({ template, onSubmit }) => {
  const [formData, setFormData] = useState<GoalTemplateFormData>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'General',
    priority: template?.priority || 'Medium',
    defaultDuration: template?.defaultDuration || 7,
    tags: template?.tags || [],
    isActive: template?.isActive ?? true
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onSubmit(formData);
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
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter template name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter template description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Learning">Learning</SelectItem>
              <SelectItem value="Community">Community</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
            </SelectContent>
          </Select>
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
        <Label htmlFor="duration">Default Duration (days)</Label>
        <Input
          id="duration"
          type="number"
          value={formData.defaultDuration}
          onChange={(e) => setFormData(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) || 7 }))}
          min="1"
          max="365"
        />
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
          <Button type="button" onClick={handleAddTag}>
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
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
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

export default AdminGoalTemplates;