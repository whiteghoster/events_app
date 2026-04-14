import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditAction } from '../auth/enums/audit-action.enum';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAuditLogsDto {
  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  entity_id?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsString()
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
          email,
          name,
          role
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

    if (findAuditLogsDto.entity_id) {
      query = query.eq('entity_id', findAuditLogsDto.entity_id);
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
          email,
          name,
          role
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
      'ID', 'When', 'Action', 'Entity', 'Entity ID', 'User Name', 'User Role', 'User Email', 
      'Old Values', 'New Values'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.created_at,
      log.action,
      log.entity_type,
      log.entity_id,
      log.users?.name || 'System',
      log.users?.role || 'admin',
      log.users?.email || 'Unknown',
      JSON.stringify(log.old_values || {}),
      JSON.stringify(log.new_values || {}),
    ]);

    return [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * CREATE LOG MANUALLY
   * Used by services to explicitly record actions
   */
  async createLog(params: {
    entity_type: string;
    entity_id: string;
    action: AuditAction | string;
    user_id: string;
    old_values?: any;
    new_values?: any;
  }) {
    const supabase = this.databaseService.getClient();

    // Sanitize values (exclude passwords)
    const sanitize = (obj: any) => {
      if (!obj) return null;
      const copy = { ...obj };
      delete copy.password;
      return copy;
    };

    const { error } = await supabase.from('audit_log').insert({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: params.action,
      user_id: params.user_id,
      old_values: sanitize(params.old_values),
      new_values: sanitize(params.new_values),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to create manual audit log:', error);
    }
  }
}
