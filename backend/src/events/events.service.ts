import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventStatus } from '../auth/enums/event-status.enum';
import { UserRole } from '../auth/enums/user-role.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventProductDto } from './dto/create-event-product.dto';
import { UpdateEventProductDto } from './dto/update-event-product.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../auth/enums/audit-action.enum';

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.LIVE]: [EventStatus.HOLD, EventStatus.FINISHED],
  [EventStatus.HOLD]: [EventStatus.FINISHED, EventStatus.LIVE],
  [EventStatus.FINISHED]: [],
};

@Injectable()
export class EventsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) { }

  private get supabase() {
    return this.databaseService.getClient();
  }

  private async getEventOrThrow(eventId: string) {
    let query = this.supabase
      .from('events')
      .select('*, assigned_staff:users(name)');

    // Handle human-readable Display ID (e.g., EVT-59022) or standard UUID
    if (eventId.startsWith('EVT-')) {
      query = query.eq('display_id', eventId);
    } else {
      query = query.eq('id', eventId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new NotFoundException('Event not found');
    }

    return data;
  }

  private enforceEventEditPermission(event: any, role: UserRole) {
    if (event.status === EventStatus.FINISHED) {
      throw new ForbiddenException('Finished events are read-only');
    }

    if (event.status === EventStatus.HOLD && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can edit hold events');
    }
  }

  private ensurePayloadNotEmpty(payload: Record<string, any>, message: string) {
    const hasValues = Object.values(payload).some((value) => value !== undefined);
    if (!hasValues) {
      throw new BadRequestException(message);
    }
  }

  private generateDisplayId(): string {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `EVT-${randomNum}`;
  }

  // ========== EVENTS ==========

  async createEvent(createEventDto: CreateEventDto, actorId: string) {
    const payload = {
      name: createEventDto.name,
      occasion_type: createEventDto.occasion_type,
      date: createEventDto.date,
      venue_name: createEventDto.venue_name,
      venue_address: createEventDto.venue_address,
      contact_person: createEventDto.contact_person,
      contact_phone: createEventDto.contact_phone,
      notes: createEventDto.notes,
      assigned_to: createEventDto.assigned_to,
      display_id: this.generateDisplayId(),
    };

    const { data, error } = await this.supabase
      .from('events')
      .insert({
        ...payload,
        status: EventStatus.LIVE,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: data.id,
      action: AuditAction.CREATED,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findEvents(
    tab?: string,
    occasionType?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const offset = Math.max(0, (page - 1) * pageSize);

    let query = this.supabase
      .from('events')
      .select('*, assigned_staff:users(name)', { count: 'exact' });

    if (tab === 'live' || tab === 'LIVE') {
      query = query.eq('status', EventStatus.LIVE).order('date', { ascending: true });
    } else if (tab === 'hold' || tab === 'HOLD') {
      query = query.eq('status', EventStatus.HOLD).order('closed_at', { ascending: false });
    } else if (tab === 'finished' || tab === 'FINISHED') {
      query = query.eq('status', EventStatus.FINISHED).order('closed_at', { ascending: false });
    } else if (tab === 'over' || tab === 'OVER') {
      query = query
        .in('status', [EventStatus.HOLD, EventStatus.FINISHED])
        .order('closed_at', { ascending: false });
    } else {
      query = query.eq('status', EventStatus.LIVE).order('date', { ascending: true });
    }

    if (occasionType) {
      query = query.eq('occasion_type', occasionType);
    }

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch events: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  async findEventById(id: string) {
    return await this.getEventOrThrow(id);
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, role: UserRole, actorId: string) {
    const event = await this.getEventOrThrow(id);
    this.enforceEventEditPermission(event, role);

    if ((updateEventDto as any).status) {
      throw new BadRequestException('Use /events/:id/close for status transitions');
    }

    const payload = {
      name: updateEventDto.name,
      occasion_type: updateEventDto.occasion_type,
      date: updateEventDto.date,
      venue_name: updateEventDto.venue_name,
      venue_address: updateEventDto.venue_address,
      contact_person: updateEventDto.contact_person,
      contact_phone: updateEventDto.contact_phone,
      notes: updateEventDto.notes,
      assigned_to: updateEventDto.assigned_to,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined),
    );

    this.ensurePayloadNotEmpty(cleanPayload, 'No valid event fields provided for update');

    const { data, error } = await this.supabase
      .from('events')
      .update(cleanPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: id,
      action: AuditAction.UPDATED,
      user_id: actorId,
      old_values: event,
      new_values: data,
    });

    return data;
  }

  async closeEvent(id: string, newStatus: EventStatus, role: UserRole, actorId: string) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can move event status');
    }

    const event = await this.getEventOrThrow(id);

    const allowed = ALLOWED_TRANSITIONS[event.status as EventStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${event.status} to ${newStatus}`,
      );
    }

    /* 
       Relaxed: No longer requiring products before HOLD. 
       This allows users to hold events mid-setup.
    */
    /*
    if (event.status === EventStatus.LIVE && newStatus === EventStatus.HOLD) {
      ...
    }
    */

    const { data, error } = await this.supabase
      .from('events')
      .update({
        status: newStatus,
        closed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update event status: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: id,
      action: 'STATUS_CHANGED',
      user_id: actorId,
      old_values: { status: event.status },
      new_values: { status: newStatus },
    });

    return data;
  }

  // ========== EVENT PRODUCTS ==========

  async createEventProduct(
    createEventProductDto: CreateEventProductDto,
    role: UserRole,
    actorId: string,
  ) {
    const event = await this.getEventOrThrow(createEventProductDto.event_id);
    this.enforceEventEditPermission(event, role);

    const { data: product, error: productError } = await this.supabase
      .from('products')
      .select('id, is_active')
      .eq('id', createEventProductDto.product_id)
      .single();

    if (productError || !product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.is_active) {
      throw new BadRequestException('Inactive products cannot be added to events');
    }

    const { data, error } = await this.supabase
      .from('event_products')
      .insert(createEventProductDto)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create event product: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: data.id,
      action: AuditAction.CREATED,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findEventProducts(
    eventId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    await this.getEventOrThrow(eventId);

    const offset = Math.max(0, (page - 1) * pageSize);

    const { data, count, error } = await this.supabase
      .from('event_products')
      .select(
        `
        *,
        product:products(
          id,
          name,
          default_unit,
          is_active,
          category:categories(id, name)
        )
      `,
        { count: 'exact' },
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch event products: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  async updateEventProduct(
    rowId: string,
    updateEventProductDto: UpdateEventProductDto,
    role: UserRole,
    actorId: string,
  ) {
    const { data: row, error: rowError } = await this.supabase
      .from('event_products')
      .select('*')
      .eq('id', rowId)
      .single();

    if (rowError || !row) {
      throw new NotFoundException('Event product row not found');
    }

    const event = await this.getEventOrThrow(row.event_id);
    this.enforceEventEditPermission(event, role);

    const cleanPayload = Object.fromEntries(
      Object.entries(updateEventProductDto).filter(([_, value]) => value !== undefined),
    );

    this.ensurePayloadNotEmpty(
      cleanPayload,
      'No valid event product fields provided for update',
    );

    // Staff members can only update quantity and unit
    if (role === UserRole.STAFF_MEMBER) {
      const allowedKeys = ['quantity', 'unit'];
      const attemptedKeys = Object.keys(cleanPayload);
      const invalidKeys = attemptedKeys.filter((k) => !allowedKeys.includes(k));

      if (invalidKeys.length > 0) {
        throw new ForbiddenException(
          `Staff Members can only update ${allowedKeys.join(', ')}. You attempted: ${invalidKeys.join(', ')}`,
        );
      }
    }

    const { data, error } = await this.supabase
      .from('event_products')
      .update(cleanPayload)
      .eq('id', rowId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update event product: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: rowId,
      action: AuditAction.UPDATED,
      user_id: actorId,
      old_values: row,
      new_values: data,
    });

    return data;
  }

  async deleteEventProduct(rowId: string, role: UserRole, actorId: string) {
    const { data: row, error: rowError } = await this.supabase
      .from('event_products')
      .select('*')
      .eq('id', rowId)
      .single();

    if (rowError || !row) {
      throw new NotFoundException('Event product row not found');
    }

    const event = await this.getEventOrThrow(row.event_id);
    this.enforceEventEditPermission(event, role);

    const { error } = await this.supabase
      .from('event_products')
      .delete()
      .eq('id', rowId);

    if (error) {
      throw new BadRequestException(`Failed to delete event product: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: rowId,
      action: AuditAction.DELETED,
      user_id: actorId,
      old_values: row,
    });

    return { message: 'Event product deleted successfully' };
  }

  async getCategorySummary(eventId: string) {
    await this.getEventOrThrow(eventId);

    const { data, error } = await this.supabase
      .from('event_products')
      .select(`
        quantity,
        unit,
        product:products(
          id,
          name,
          category:categories(id, name)
        )
      `)
      .eq('event_id', eventId);

    if (error) {
      throw new BadRequestException(`Failed to fetch category summary: ${error.message}`);
    }

    const summaryMap: Record<string, Record<string, number>> = {};

    for (const row of data ?? []) {
      const product = row.product as any;
      const categoryName = product?.category?.name || 'Uncategorized';
      const unit = row.unit || 'unit';
      const qty = Number(row.quantity || 0);

      if (!summaryMap[categoryName]) summaryMap[categoryName] = {};
      if (!summaryMap[categoryName][unit]) summaryMap[categoryName][unit] = 0;

      summaryMap[categoryName][unit] += qty;
    }

    return Object.entries(summaryMap).map(([category, units]) => ({
      category,
      totals: Object.entries(units).map(([unit, quantity]) => ({
        unit,
        quantity,
      })),
    }));
  }

  async deleteEvent(id: string, role: UserRole, actorId: string) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete events');
    }

    const event = await this.getEventOrThrow(id);

    const { error } = await this.supabase.from('events').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete event: ${error.message}`);
    }

    // Audit Log
    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: id,
      action: AuditAction.DELETED, // Treated as Hard Delete here per logic
      user_id: actorId,
      old_values: event,
    });

    return { message: 'Event deleted successfully' };
  }
}