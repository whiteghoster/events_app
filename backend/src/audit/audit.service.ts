import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditAction, AuditLog, AuditLogResult } from '../common/types';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';
import { sanitizeSearchTerm, escapeCsvCell } from '../common/utils';

const AUDIT_SELECT = `*, users (email, name, role)`;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  async findAll(dto: FindAuditLogsDto = {}): Promise<AuditLogResult> {
    const limit = Math.min(dto.limit || 25, 100);
    const page = Math.max(dto.page || 1, 1);

    this.logger.debug(`Audit query params: ${JSON.stringify(dto)}`);
    
    let query = this.supabase
      .from('audit_log')
      .select(AUDIT_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (dto.entity_type) query = query.eq('entity_type', dto.entity_type);
    if (dto.action) query = query.eq('action', dto.action);
    if (dto.user_id) query = query.eq('user_id', dto.user_id);
    if (dto.entity_id) query = query.eq('entity_id', dto.entity_id);
    if (dto.date_from) query = query.gte('created_at', dto.date_from);
    if (dto.date_to) query = query.lte('created_at', dto.date_to);

    // Filter by user role - bounded query with limit to prevent N+1
    if (dto.user_role) {
      const MAX_USERS_PER_ROLE = 1000;
      const { data: usersWithRole } = await this.supabase
        .from('users')
        .select('id')
        .eq('role', dto.user_role)
        .limit(MAX_USERS_PER_ROLE);

      if (usersWithRole && usersWithRole.length > 0) {
        query = query.in('user_id', usersWithRole.map(u => u.id));
      } else {
        return { data: [], meta: { page, page_size: limit, total: 0, total_pages: 0 } };
      }
    }

    if (dto.search) {
      const sanitized = sanitizeSearchTerm(dto.search);
      if (sanitized) {
        query = query.or(
          `old_values.ilike.%${sanitized}%,new_values.ilike.%${sanitized}%,entity_type.ilike.%${sanitized}%`,
        );
      }
    }

    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      this.logger.error(`Failed to fetch audit logs: ${error.message}`);
      throw new BadRequestException(`Failed to fetch audit logs: ${error.message}`);
    }

    this.logger.debug(`Query returned ${data?.length || 0} rows, total count: ${count || 0}`);

    const total = count ?? 0;
    return {
      data: (data ?? []) as AuditLog[],
      meta: {
        page,
        page_size: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('audit_log')
      .select(AUDIT_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Audit log not found');
    }

    return data as AuditLog;
  }

  async exportAuditLogs(dto: FindAuditLogsDto = {}) {
    const result = await this.findAll(dto);
    const csv = this.convertToCSV(result.data);

    return {
      logs: result.data,
      csv,
      filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  private convertToCSV(logs: AuditLog[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'ID', 'When', 'Action', 'Entity', 'Entity ID',
      'User Name', 'User Role', 'User Email',
      'Old Values', 'New Values',
    ];

    const csvRows = logs.map((log) => [
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
      headers.map(escapeCsvCell).join(','),
      ...csvRows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\n');
  }

  private readonly actionMap: Record<string, string> = {
    create: 'create', 0: 'create',
    update: 'update', 1: 'update',
    delete: 'delete', 2: 'delete',
  };

  private sanitize(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    const { password, ...rest } = obj as Record<string, unknown>;
    return rest;
  }

  async createLog(params: {
    entity_type: string;
    entity_id: string;
    action: AuditAction | string;
    user_id: string;
    old_values?: unknown;
    new_values?: unknown;
  }) {
    const actionKey = String(params.action).toLowerCase();
    const action = this.actionMap[actionKey] || 'create';

    const { error } = await this.supabase.from('audit_log').insert({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: action,
      user_id: params.user_id,
      old_values: this.sanitize(params.old_values),
      new_values: this.sanitize(params.new_values),
      created_at: new Date().toISOString(),
    });

    if (error) {
      this.logger.error(`Failed to create audit log for ${params.entity_type}:${params.entity_id}: ${error.message}`);
    }
  }
}
