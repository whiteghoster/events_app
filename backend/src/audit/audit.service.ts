import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditAction } from '../auth/enums/audit-action.enum';

export class FindAuditLogsDto {
  entity_type?: string;
  action?: AuditAction;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  page?: number;
  search?: string;
}

export interface AuditLogResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

@Injectable()
export class AuditService {
  constructor(private databaseService: DatabaseService) {}

  async findAll(findAuditLogsDto: FindAuditLogsDto = {}): Promise<AuditLogResult> {
    const supabase = this.databaseService.getClient();
    
    let query = supabase
      .from('audit_log')
      .select(`
        *,
        users (
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (findAuditLogsDto.entity_type) {
      query = query.eq('entity_type', findAuditLogsDto.entity_type);
    }

    if (findAuditLogsDto.action) {
      query = query.eq('action', findAuditLogsDto.action);
    }

    if (findAuditLogsDto.user_id) {
      query = query.eq('user_id', findAuditLogsDto.user_id);
    }

    if (findAuditLogsDto.date_from) {
      query = query.gte('created_at', findAuditLogsDto.date_from);
    }

    if (findAuditLogsDto.date_to) {
      query = query.lte('created_at', findAuditLogsDto.date_to);
    }

    if (findAuditLogsDto.search) {
      query = query.or(`old_values.ilike.%${findAuditLogsDto.search},new_values.ilike.%${findAuditLogsDto.search},entity_type.ilike.%${findAuditLogsDto.search},users.email.ilike.%${findAuditLogsDto.search}`);
    }

    // Pagination
    const limit = Math.min(findAuditLogsDto.limit || 50, 100);
    const page = findAuditLogsDto.page || 1;
    const offset = (page - 1) * limit;

    if (findAuditLogsDto.limit) {
      query = query.limit(limit);
    }

    if (page > 1) {
      query = query.range(offset, limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: data?.length || 0,
        hasMore: data?.length === limit
      }
    };
  }

  async findById(id: string) {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('audit_log')
      .select(`
        *,
        users (
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    return data;
  }

  async exportAuditLogs(findAuditLogsDto: FindAuditLogsDto = {}) {
    try {
      const result = await this.findAll(findAuditLogsDto);
      
      // Convert to CSV format
      const csv = this.convertToCSV(result.data);
      
      return {
        success: true,
        data: {
          logs: result.data,
          csv,
          filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
        }
      };
    } catch (error) {
      throw new Error(`Failed to export audit logs: ${error.message}`);
    }
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'ID', 'Entity Type', 'Entity ID', 'Action', 'User ID', 'User Email', 
      'Old Values', 'New Values', 'Created At'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.entity_type,
      log.entity_id,
      log.action,
      log.user_id,
      log.users?.email || 'Unknown',
      JSON.stringify(log.old_values || {}),
      JSON.stringify(log.new_values || {}),
      log.created_at
    ]);

    return [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
}
