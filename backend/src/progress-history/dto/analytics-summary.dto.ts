import { Goal } from "src/database/entities";
import { GoalStatus, GoalPriority } from "src/database/enums/goals.enums";

export class AnalyticsSummaryDto {
    totalEntries:number;
    totalVolunteers: number;
    overallCompletionRate: number;
    averageProgress: number;

    statusDistribution: {
        status: GoalStatus;
        count: number;
        percentage: number;
    }[];

    categoryPerformance: {
        category: string;
        entries:number;
        averageProgress: number;
        completionRate:number;
    }[];

    weeklyTrends: {
        weekStart: Date;
        weekEnd: Date;
        totalEntries:number;
        averageProgress:number;
        completionRate: number;
    }[];

    topPerformers: {
        volunteerId: string;
        volunteerName: string;
        completionRate: number;
        averageProgress: number;
        totalEntries:number;
    }[];

    recentActivity: {
        date: Date;
        action: string;
        volunteerName: string;
        goalTitle: string;
        progress?: number;
    }[];
}


export class HistoricalGoalDto {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  notes?: string;
}

export class HistoricalWeekDto {
  weekStart: string;
  weekEnd: string;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
  completionRate: number;
  goals: HistoricalGoalDto[];
}

export class VolunteerWeeklyHistoryDto {
  volunteerId: string;
  volunteerName: string;
  totalWeeks: number;
  overallStats: {
    totalGoals: number;
    completedGoals: number;
    averageProgress: number;
    averageCompletionRate: number;
  };
  weeks: HistoricalWeekDto[];
}