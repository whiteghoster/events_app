import apiClient from './api';
import { AuditEntry, AuditFilter } from '@/types/audit';

export interface AuditResponse {
  data: AuditEntry[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface ExportResponse {
  data: AuditEntry[];
}

export const auditService = {
  async getAudits(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: AuditFilter;
  }): Promise<AuditResponse> {
    const response = await apiClient.get('/audit', { params });
    return response.data;
  },

  async deleteRecords(ids: string[]): Promise<void> {
    await apiClient.delete('/audit/logs', {
      data: { ids },
    });
  },

  async exportRecords(format: 'csv' | 'xlsx' | 'pdf', filters?: AuditFilter): Promise<Blob> {
    const response = await apiClient.get('/audit', {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
  },

  async getAuditStats(dateRange?: { startDate: string; endDate: string }): Promise<{
    totalRecords: number;
    totalDeletes: number;
    totalCreates: number;
    totalUpdates: number;
    topClients: Array<{ client: string; count: number }>;
    topOperations: Array<{ operation: string; count: number }>;
  }> {
    const response = await apiClient.get('/audit', {
      params: { ...dateRange, stats: true },
    });
    return response.data;
  },

  async getAuditTrends(
    dateRange: { startDate: string; endDate: string },
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; creates: number; updates: number; deletes: number }>> {
    const response = await apiClient.get('/audit', {
      params: { ...dateRange, groupBy, trends: true },
    });
    return response.data;
  },
};
