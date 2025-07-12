
import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => (
  <div className={cn('space-y-3 p-4 border rounded-lg', className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex space-x-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
    </div>
  </div>
);

export const SkeletonGoalCard: React.FC<SkeletonCardProps> = ({ className }) => (
  <div className={cn('space-y-4 p-6 border rounded-lg', className)}>
    <Skeleton className="h-6 w-4/5" />
    <Skeleton className="h-3 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-2 w-full" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-20" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    <div className="grid grid-cols-4 gap-4 pb-2 border-b">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4 py-2">
        {Array.from({ length: 4 }).map((_, j) => (
          <Skeleton key={j} className="h-4 w-3/4" />
        ))}
      </div>
    ))}
  </div>
);