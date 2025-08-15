import httpClient from './httpClient';
import type { 
  SystemOverviewDto,
  PersonalAnalyticsDto,
  AnalyticsDataDto,
  VolunteerPerformanceDto,
  ExportReportDto
} from '../types/analytics';

class AnalyticsApiService {
  // SYSTEM ANALYTICS
  async getSystemOverview(params?: { startDate?: string; endDate?: string }): Promise<SystemOverviewDto> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    return httpClient.get<SystemOverviewDto>(`/analytics/system-overview${qs.toString() ? '?' + qs : ''}`);
  }

  async getAnalyticsData(params?: { startDate?: string; endDate?: string }): Promise<AnalyticsDataDto> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    return httpClient.get<AnalyticsDataDto>(`/analytics/data${qs.toString() ? '?' + qs : ''}`);
  }

  async getCompletionTrends(params?: { startDate?: string; endDate?: string }): Promise<AnalyticsDataDto['completionTrends']> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    return httpClient.get<AnalyticsDataDto['completionTrends']>(`/analytics/completion-trends${qs.toString() ? '?' + qs : ''}`);
  }

  async getPerformanceDistribution(): Promise<AnalyticsDataDto['performanceDistribution']> {
    return httpClient.get<AnalyticsDataDto['performanceDistribution']>('/analytics/performance-distribution');
  }

  async getCategoryBreakdown(params?: { startDate?: string; endDate?: string }): Promise<AnalyticsDataDto['categoryBreakdown']> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    return httpClient.get<AnalyticsDataDto['categoryBreakdown']>(`/analytics/category-breakdown${qs.toString() ? '?' + qs : ''}`);
  }

  async getVolunteerActivity(params?: { startDate?: string; endDate?: string }): Promise<AnalyticsDataDto['volunteerActivity']> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    return httpClient.get<AnalyticsDataDto['volunteerActivity']>(`/analytics/volunteer-activity${qs.toString() ? '?' + qs : ''}`);
  }

  async getVolunteerPerformance(): Promise<VolunteerPerformanceDto[]> {
    return httpClient.get<VolunteerPerformanceDto[]>('/analytics/volunteer-performance');
  }

  // PERSONAL
  async getPersonalAnalytics(volunteerId: string, params?: { startDate?: string; endDate?: string }): Promise<PersonalAnalyticsDto> {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    return httpClient.get<PersonalAnalyticsDto>(`/analytics/personal/${volunteerId}${qs.toString() ? '?' + qs : ''}`);
  }

  // EXPORT
  async exportReport(body: { type: 'overview' | 'performance' | 'goals'; filters?: any }): Promise<ExportReportDto> {
    return httpClient.post<ExportReportDto>('/analytics/export', body);
  }

  getDateRange(range: '7days' | '30days' | '90days' | '1year'): { startDate: string; endDate: string } {
    const now = new Date();
    const start = new Date();
    if (range === '7days') start.setDate(now.getDate() - 7);
    else if (range === '30days') start.setDate(now.getDate() - 30);
    else if (range === '90days') start.setDate(now.getDate() - 90);
    else if (range === '1year') start.setFullYear(now.getFullYear() - 1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }
}

export const analyticsApi = new AnalyticsApiService();
export default analyticsApi;