
import React, { useState } from 'react';
import { Clock, MessageSquare, Check, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ProgressEntry {
  id: string;
  timestamp: string;
  progress: number;
  notes: string;
}

interface ProgressUpdateProps {
  goalId: number;
  currentProgress: number;
  progressHistory: ProgressEntry[];
  onProgressUpdate: (goalId: number, progress: number, notes: string) => void;
  onMarkComplete: (goalId: number) => void;
}

const ProgressUpdate: React.FC<ProgressUpdateProps> = ({
  goalId,
  currentProgress,
  progressHistory,
  onProgressUpdate,
  onMarkComplete,
}) => {
  const [progress, setProgress] = useState([currentProgress]);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmitProgress = () => {
    if (notes.trim()) {
      onProgressUpdate(goalId, progress[0], notes);
      setNotes('');
      setIsUpdating(false);
    }
  };

  const handleMarkComplete = () => {
    onMarkComplete(goalId);
    setProgress([100]);
    setIsUpdating(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Progress Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Progress</span>
          <span className="text-lg font-bold text-indigo-600">{currentProgress}%</span>
        </div>

        {/* Progress Update Interface */}
        {!isUpdating ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdating(true)}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
            {currentProgress < 100 && (
              <Button
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="progress-slider">Progress: {progress[0]}%</Label>
              <Slider
                id="progress-slider"
                min={0}
                max={100}
                step={5}
                value={progress}
                onValueChange={setProgress}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="progress-notes">Update Notes</Label>
              <Textarea
                id="progress-notes"
                placeholder="Describe your progress, challenges, or achievements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitProgress}
                disabled={!notes.trim()}
                className="flex-1"
              >
                Submit Update
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUpdating(false);
                  setProgress([currentProgress]);
                  setNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Progress History */}
        {progressHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Updates</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {progressHistory.slice(-5).reverse().map((entry) => (
                <div key={entry.id} className="flex gap-3 p-3 bg-white border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-600">
                        {entry.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(entry.timestamp)}
                    </div>
                    <p className="text-sm text-gray-700">{entry.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressUpdate;