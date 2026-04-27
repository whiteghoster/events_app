import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditAction, AuditLog, AuditLogResult } from '../common/types';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';
import { sanitizeSearchTerm, escapeCsvCell, paginate } from '../common/utils';

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
    const offset = (page - 1) * limit;

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
    if (dto.user_role) query = query.eq('users.role', dto.user_role);

    if (dto.search) {
      const sanitized = sanitizeSearchTerm(dto.search);
      if (sanitized) {
        query = query.or(
          `old_values.ilike.%${sanitized}%,new_values.ilike.%${sanitized}%,entity_type.ilike.%${sanitized}%`,
        );
      }
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(`Failed to fetch audit logs: ${error.message}`);

    // Enrich audit logs with event display IDs for Event and Event Product entities
    const enrichedData = await this.enrichWithEventDisplayIds(data ?? []);

    return {
      data: enrichedData as AuditLog[],
      meta: {
        page,
        page_size: limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  private async enrichWithEventDisplayIds(logs: any[]): Promise<any[]> {
    if (logs.length === 0) return logs;

    // Get unique event IDs from Event and Event Product entities
    const eventIds = new Set<string>();
    logs.forEach(log => {
      if (log.entity_type === 'Event' || log.entity_type === 'Event Product') {
        eventIds.add(log.entity_id);
      }
    });

    if (eventIds.size === 0) return logs;

    // Fetch display_ids for these events
    const { data: events } = await this.supabase
      .from('events')
      .select('id, display_id')
      .in('id', Array.from(eventIds));

    if (!events || events.length === 0) return logs;

    // Create a map of event_id -> display_id
    const displayIdMap = new Map(events.map(e => [e.id, e.display_id]));

    // Add entity_display_id to each log
    return logs.map(log => ({
      ...log,
      entity_display_id: displayIdMap.get(log.entity_id) || undefined,
    }));
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('audit_log')
      .select(AUDIT_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Audit log not found');
    return data as AuditLog;
  }

  async exportAuditLogs(dto: FindAuditLogsDto = {}) {
    const result = await this.findAll(dto);

    return {
      logs: result.data,
      csv: this.convertToCSV(result.data),
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
      log.id, log.created_at, log.action, log.entity_type, log.entity_id,
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

  private sanitize(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    const { password, ...rest } = obj as Record<string, unknown>;
    return rest;
  }

  createLog(params: {
    entity_type: string;
    entity_id: string;
    action: AuditAction;
    user_id: string;
    old_values?: unknown;
    new_values?: unknown;
  }) {
    this.supabase.from('audit_log').insert({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: params.action,
      user_id: params.user_id,
      old_values: this.sanitize(params.old_values),
      new_values: this.sanitize(params.new_values),
    }).then(({ error }) => {
      if (error) this.logger.error(`Audit log failed for ${params.entity_type}:${params.entity_id}: ${error.message}`);
    });
  }
}
