import React from 'react';
import { Modal } from './ui/modal';
import { EnhancedGoalForm } from './enhanced-goal-form';
import { Button } from './ui/button';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: any) => Promise<void>;
  initialData?: any;
  title?: string;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title
}) => {
  const handleSubmit = async (goalData: any) => {
    try {
      await onSubmit(goalData);
      onClose(); // Close modal after successful submission
    } catch (error) {
      // Error handling is done in the form component
      console.error('Goal submission error:', error);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title || (initialData ? 'Edit Goal' : 'Create New Goal')}
      size="lg"
    >
      <div className="p-6">
        <EnhancedGoalForm
          onSubmit={handleSubmit}
          initialData={initialData}
        />
        
        {/* Modal Footer */}
        <div className="flex justify-end pt-4 mt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};