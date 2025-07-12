
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
}

interface DragDropGoalsProps {
  goals: Goal[];
  onReorder: (reorderedGoals: Goal[]) => void;
}

export const DragDropGoals: React.FC<DragDropGoalsProps> = ({ goals, onReorder }) => {
  const [draggedItem, setDraggedItem] = useState<Goal | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, goal: Goal) => {
    setDraggedItem(goal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const dragIndex = goals.findIndex(goal => goal.id === draggedItem.id);
    if (dragIndex === dropIndex) return;

    const newGoals = [...goals];
    const [removed] = newGoals.splice(dragIndex, 1);
    newGoals.splice(dropIndex, 0, removed);

    onReorder(newGoals);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-l-red-500';
      case 'Medium': return 'border-l-yellow-500';
      case 'Low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in-progress': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {goals.map((goal, index) => (
        <Card
          key={goal.id}
          className={`
            p-4 cursor-move transition-all duration-200 border-l-4
            ${getPriorityColor(goal.priority)}
            ${getStatusColor(goal.status)}
            ${draggedItem?.id === goal.id ? 'opacity-50 scale-95' : ''}
            ${dragOverIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''}
            hover:shadow-md
          `}
          draggable
          onDragStart={(e) => handleDragStart(e, goal)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          role="listitem"
          aria-label={`Goal: ${goal.title}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // Handle keyboard navigation for accessibility
            }
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
              aria-label="Drag handle"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${goal.priority === 'High' ? 'bg-red-100 text-red-800' : ''}
                    ${goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${goal.priority === 'Low' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {goal.priority}
                  </span>
                  
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full capitalize
                    ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${goal.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                    ${goal.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {goal.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                      aria-label={`Progress: ${goal.progress}%`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 min-w-0">
                    {goal.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {goals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No goals to display. Create your first goal to get started!</p>
        </div>
      )}
    </div>
  );
};