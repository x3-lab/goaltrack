import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface NotificationComposerProps {
  onSend: (notification: any) => void;
}

export const NotificationComposer: React.FC<NotificationComposerProps> = ({ onSend }) => {
  const [formData, setFormData] = useState({
    recipients: 'all',
    subject: '',
    message: '',
    priority: 'medium',
    type: 'email'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      return;
    }

    onSend(formData);
    
    // Reset form
    setFormData({
      recipients: 'all',
      subject: '',
      message: '',
      priority: 'medium',
      type: 'email'
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipients">Recipients</Label>
          <Select value={formData.recipients} onValueChange={(value) => handleChange('recipients', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Volunteers</SelectItem>
              <SelectItem value="active">Active Volunteers</SelectItem>
              <SelectItem value="inactive">Inactive Volunteers</SelectItem>
              <SelectItem value="overdue">Volunteers with Overdue Goals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="Enter notification subject"
          required
        />
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Enter your message"
          rows={4}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        <Send className="h-4 w-4 mr-2" />
        Send Notification
      </Button>
    </form>
  );
};