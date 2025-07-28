import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { GoalTemplate, api } from '../services/api';
import { Calendar, Target, Star } from 'lucide-react';

interface TemplateUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: GoalTemplate | null;
  onGoalCreated?: (goal: any) => void;
  volunteerId?: string;
}

export const TemplateUsageModal: React.FC<TemplateUsageModalProps> = ({
  isOpen,
  onClose,
  template,
  onGoalCreated,
  volunteerId
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    customNotes: ''
  });

  // Reset form when template changes
  React.useEffect(() => {
    if (template) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + template.defaultDuration);
      
      setFormData({
        title: template.name,
        description: template.description,
        dueDate: defaultDueDate.toISOString().split('T')[0],
        customNotes: ''
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setLoading(true);
    try {
      const goal = await api.goalTemplates.useTemplate(template.id, {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        volunteerId,
        customNotes: formData.customNotes
      });

      toast({
        title: "Goal Created",
        description: `Goal "${formData.title}" has been created from template`,
      });

      if (onGoalCreated) {
        onGoalCreated(goal);
      }

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create goal from template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use Template: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-blue-900">{template.name}</h3>
                <p className="text-sm text-blue-700">{template.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {template.priority} Priority
                </Badge>
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <Star className="h-4 w-4" />
                  <span>{template.usageCount} uses</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-blue-800 mb-3">{template.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-blue-700">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Default: {template.defaultDuration} days</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{template.tags.length} tags</span>
              </div>
            </div>

            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Goal Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter goal title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Customize the goal description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customNotes">Additional Notes</Label>
              <Textarea
                id="customNotes"
                value={formData.customNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, customNotes: e.target.value }))}
                placeholder="Add any additional notes or customizations..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Goal'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};