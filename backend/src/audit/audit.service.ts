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
    if (dto.event_id) {
      // Filter for event_id in JSONB columns using @> (contains) operator
      // This is more reliable across different Supabase/PostgREST versions
      const eventIdMatch = { event_id: dto.event_id };
      const eventIdJson = JSON.stringify(eventIdMatch);
      
      if (dto.entity_type) {
        // Combine entity_type with JSONB contains check
        // Use or() to check both new_values and old_values
        query = query.or(
          `and(entity_type.eq.${dto.entity_type},new_values.cs.${eventIdJson}),and(entity_type.eq.${dto.entity_type},old_values.cs.${eventIdJson})`
        );
      } else {
        // Check both new_values and old_values for event_id using @> operator
        query = query.or(`new_values.cs.${eventIdJson},old_values.cs.${eventIdJson}`);
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

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`[Audit] Query failed: ${error.message}`, { event_id: dto.event_id, entity_type: dto.entity_type });
      throw new BadRequestException(`Failed to fetch audit logs: ${error.message}`);
    }
    
    this.logger.log(`[Audit] Fetched ${data?.length || 0} logs for event_id=${dto.event_id}`);

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

    // Normalize entity type for comparison
    const normalizeEntityType = (type: string) => (type || '').toLowerCase().replace(/s$/, '');

    // Get unique event IDs from Event and Event Product entities
    const eventIds = new Set<string>();
    logs.forEach(log => {
      const normalizedType = normalizeEntityType(log.entity_type);
      if (normalizedType === 'event') {
        eventIds.add(log.entity_id);
      } else if (normalizedType === 'event product') {
        // For Event Products, event_id is in new_values or old_values
        const eventId = log.new_values?.event_id || log.old_values?.event_id;
        if (eventId) eventIds.add(eventId);
      }
    });

    if (eventIds.size === 0) return logs;

    // Fetch display_ids for these events
    const { data: events, error } = await this.supabase
      .from('events')
      .select('id, display_id')
      .in('id', Array.from(eventIds));

    if (error) {
      this.logger.error(`Error fetching events for audit enrichment: ${error.message}`);
      return logs;
    }

    // Create a map of event_id -> display_id (from database)
    const displayIdMap = new Map<string, string>();
    if (events) {
      events.forEach(e => displayIdMap.set(e.id, e.display_id));
    }

    // Add entity_display_id to each log
    return logs.map(log => {
      let displayId: string | undefined;
      const normalizedType = normalizeEntityType(log.entity_type);

      if (normalizedType === 'event') {
        // Try database first, then fallback to old_values/new_values
        displayId = displayIdMap.get(log.entity_id)
          || log.old_values?.display_id
          || log.new_values?.display_id;
      } else if (normalizedType === 'event product') {
        const eventId = log.new_values?.event_id || log.old_values?.event_id;
        if (eventId) {
          displayId = displayIdMap.get(eventId)
            || log.old_values?.display_id
            || log.new_values?.display_id;
        }
      }
      console.log(`[Audit] Mapping log ${log.id} (${log.entity_type}/${log.action}): entity_id=${log.entity_id} -> displayId=${displayId}`);
      return {
        ...log,
        entity_display_id: displayId,
      };
    });
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

  async createLog(params: {
    entity_type: string;
    entity_id: string;
    action: AuditAction;
    user_id: string;
    old_values?: unknown;
    new_values?: unknown;
  }) {
    let eventCode: string | undefined;

    // Capture event_code for Event and Event Product entities
    const normalizedType = (params.entity_type || '').toLowerCase().replace(/s$/, '');
    if (normalizedType === 'event') {
      // For Event entities, fetch display_id from events table
      const { data: event } = await this.supabase
        .from('events')
        .select('display_id')
        .eq('id', params.entity_id)
        .single();
      eventCode = event?.display_id;
    } else if (normalizedType === 'event product') {
      // For Event Product entities, fetch display_id from parent event
      const eventId = (params.new_values as any)?.event_id || (params.old_values as any)?.event_id;
      if (eventId) {
        const { data: event } = await this.supabase
          .from('events')
          .select('display_id')
          .eq('id', eventId)
          .single();
        eventCode = event?.display_id;
      }
    }

    this.supabase.from('audit_log').insert({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: params.action,
      user_id: params.user_id,
      old_values: this.sanitize(params.old_values),
      new_values: this.sanitize(params.new_values),
      event_code: eventCode,
    }).then(({ error }) => {
      if (error) this.logger.error(`Audit log failed for ${params.entity_type}:${params.entity_id}: ${error.message}`);
    });
  }
}
