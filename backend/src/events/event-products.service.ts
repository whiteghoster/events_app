import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole, AuditAction } from '../common/types';
import { CreateEventProductDto } from './dto/create-event-product.dto';
import { UpdateEventProductDto } from './dto/update-event-product.dto';
import { EventsService } from './events.service';
import { AuditService } from '../audit/audit.service';
import { stripUndefined, paginate, paginationOffset } from '../common/utils';

@Injectable()
export class EventProductsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  async createEventProduct(
    dto: CreateEventProductDto,
    role: UserRole,
    actorId: string,
  ) {
    // Atomic: validates event status + product active + inserts in single transaction
    const { data, error } = await this.supabase.rpc('create_event_product_validated', {
      p_event_id: dto.event_id,
      p_product_id: dto.product_id,
      p_quantity: dto.quantity,
      p_unit: dto.unit,
      p_price: dto.price ?? null,
      p_actor_id: actorId,
      p_actor_role: role,
    });

    if (error) {
      if (error.message?.includes('not found')) throw new NotFoundException(error.message);
      if (error.message?.includes('read-only') || error.message?.includes('Only admin')) {
        throw new ForbiddenException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: data.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findEventProducts(eventId: string, page: number = 1, pageSize: number = 20) {
    // Resolve display_id to UUID if needed, then query directly — no separate validation query
    const resolvedId = await this.resolveEventId(eventId);
    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('event_products')
      .select(
        `*, product:products(id, name, default_unit, is_active, category:categories(id, name))`,
        { count: 'exact' },
      )
      .eq('event_id', resolvedId)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new BadRequestException(`Failed to fetch event products: ${error.message}`);
    return paginate(data, count, page, pageSize);
  }

  async updateEventProduct(
    eventProductId: string,
    dto: UpdateEventProductDto,
    role: UserRole,
    actorId: string,
  ) {
    // Single query: get event_product + event status via RPC join
    const { data: joined, error: joinErr } = await this.supabase
      .rpc('get_event_product_with_event', { p_event_product_id: eventProductId });

    if (joinErr || !joined) throw new NotFoundException('Event product not found');

    const { event_product: row, event_status: eventStatus, event_created_by: createdBy } = joined;

    this.eventsService.enforceEventEditPermission(
      { status: eventStatus, created_by: createdBy },
      role,
      actorId,
    );

    const cleanPayload = stripUndefined(dto as Record<string, any>);
    if (Object.keys(cleanPayload).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    if (role === UserRole.MANAGER) {
      const allowedKeys = ['quantity', 'unit'];
      const invalidKeys = Object.keys(cleanPayload).filter(k => !allowedKeys.includes(k));
      if (invalidKeys.length > 0) {
        throw new ForbiddenException(`Managers can only update ${allowedKeys.join(', ')}`);
      }
    }

    const { data, error } = await this.supabase
      .from('event_products')
      .update(cleanPayload)
      .eq('id', eventProductId)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update event product: ${error.message}`);

    this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: eventProductId,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: row,
      new_values: data,
    });

    return data;
  }

  async deleteEventProduct(eventProductId: string, role: UserRole, actorId: string) {
    // Single query: get event_product + event status
    const { data: joined, error: joinErr } = await this.supabase
      .rpc('get_event_product_with_event', { p_event_product_id: eventProductId });

    if (joinErr || !joined) throw new NotFoundException('Event product not found');

    const { event_product: row, event_status: eventStatus, event_created_by: createdBy } = joined;

    this.eventsService.enforceEventEditPermission(
      { status: eventStatus, created_by: createdBy },
      role,
      actorId,
    );

    const { error } = await this.supabase
      .from('event_products')
      .delete()
      .eq('id', eventProductId);

    if (error) throw new BadRequestException(`Failed to delete event product: ${error.message}`);

    this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: eventProductId,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: row,
    });
  }

  async getCategorySummary(eventId: string) {
    const resolvedId = await this.resolveEventId(eventId);

    const { data, error } = await this.supabase
      .rpc('get_event_category_summary', { p_event_id: resolvedId });

    if (error) throw new BadRequestException(`Failed to fetch category summary: ${error.message}`);
    return data || [];
  }

  private async resolveEventId(eventId: string): Promise<string> {
    const isDisplayId = /^[A-Z]{2}-\d{2}$/.test(eventId) || eventId.startsWith('EVT-');
    if (!isDisplayId) return eventId;

    const { data, error } = await this.supabase
      .from('events')
      .select('id')
      .eq('display_id', eventId)
      .single();

    if (error || !data) throw new NotFoundException('Event not found');
    return data.id;
  }
}
