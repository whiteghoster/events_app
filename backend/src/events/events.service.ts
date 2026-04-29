import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventStatus, UserRole, AuditAction } from '../common/types';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuditService } from '../audit/audit.service';
import { stripUndefined, paginate, paginationOffset } from '../common/utils';

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.LIVE]: [EventStatus.HOLD, EventStatus.FINISHED],
  [EventStatus.HOLD]: [EventStatus.FINISHED, EventStatus.LIVE],
  [EventStatus.FINISHED]: [EventStatus.HOLD],
};

@Injectable()
export class EventsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  private readonly VALIDATION_FIELDS = 'id, status, created_by, client_name';

  private readonly LIST_FIELDS = [
    'id', 'client_name', 'venue', 'status', 'display_id',
    'delivery_from_date', 'delivery_to_date', 'manager_name', 'head_karigar_name',
  ].join(',');

  async getEventOrThrow(eventId: string, fields: string = '*'): Promise<any> {
    const isDisplayId = /^[A-Z]{2,}-\d{2,3}$/.test(eventId);
    const column = isDisplayId ? 'display_id' : 'id';

    const { data, error } = await this.supabase
      .from('events')
      .select(fields as '*')
      .eq(column, eventId)
      .single();

    if (error || !data) throw new NotFoundException('Event not found');
    return data;
  }

  enforceEventEditPermission(event: any, role: UserRole, actorId: string) {
    if (event.status === EventStatus.FINISHED) {
      if (event.created_by !== actorId && role !== UserRole.ADMIN) {
        throw new ForbiddenException('Finished events are read-only');
      }
    }
    if (event.status === EventStatus.HOLD && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can edit hold events');
    }
  }

  async createEvent(createEventDto: CreateEventDto, actorId: string) {
    const { data, error } = await this.supabase.rpc('create_event_with_display_id', {
      p_client_name: createEventDto.client_name,
      p_company_name: createEventDto.company_name || null,
      p_contact_phone: createEventDto.contact_phone || null,
      p_event_date: createEventDto.event_date || null,
      p_venue: createEventDto.venue || null,
      p_venue_address: createEventDto.venue_address || null,
      p_city: createEventDto.city || null,
      p_head_karigar_name: createEventDto.head_karigar_name || null,
      p_manager_name: createEventDto.manager_name || null,
      p_delivery_from_date: createEventDto.delivery_from_date || null,
      p_delivery_to_date: createEventDto.delivery_to_date || null,
      p_created_by: actorId,
    });

    if (error) throw new BadRequestException(`Failed to create event: ${error.message}`);

    return data;
  }

  async findEvents(
    occasionType?: string,
    status?: EventStatus,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const offset = paginationOffset(page, pageSize);

    let query = this.supabase
      .from('events')
      .select(this.LIST_FIELDS, { count: 'exact' })
      .order('delivery_from_date', { ascending: true });

    if (occasionType) query = query.eq('occasion_type', occasionType);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new BadRequestException(`Failed to fetch events: ${error.message}`);
    return paginate(data, count, page, pageSize);
  }

  async findEventById(id: string) {
    return this.getEventOrThrow(id);
  }

  async getUniqueClients(limit: number = 500) {
    const { data, error } = await this.supabase
      .rpc('get_unique_clients', { row_limit: limit });

    if (error) throw new BadRequestException(`Failed to fetch clients: ${error.message}`);
    return data || [];
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, role: UserRole, actorId: string) {
    const fieldPayload = stripUndefined({
      client_name: updateEventDto.client_name,
      company_name: updateEventDto.company_name,
      contact_phone: updateEventDto.contact_phone,
      event_date: updateEventDto.event_date,
      venue: updateEventDto.venue,
      venue_address: updateEventDto.venue_address,
      city: updateEventDto.city,
      head_karigar_name: updateEventDto.head_karigar_name,
      manager_name: updateEventDto.manager_name,
      delivery_from_date: updateEventDto.delivery_from_date,
      delivery_to_date: updateEventDto.delivery_to_date,
    });

    const hasFieldChanges = Object.keys(fieldPayload).length > 0;

    // Status-only: atomic SQL (prevents race conditions on concurrent status changes)
    if (updateEventDto.status && !hasFieldChanges) {
      return this.updateEventStatus(id, updateEventDto.status, actorId);
    }

    // Field update: validate permissions first
    const event = await this.getEventOrThrow(id, this.VALIDATION_FIELDS);

    if (updateEventDto.status) {
      // Mixed update: validate transition
      const currentStatus = event.status as EventStatus;
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(updateEventDto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${currentStatus} to ${updateEventDto.status}`,
        );
      }
    } else {
      this.enforceEventEditPermission(event, role, actorId);
    }

    const updatePayload: Record<string, any> = { ...fieldPayload };

    // Auto-generate display_id when client name changes
    if (updateEventDto.client_name && updateEventDto.client_name !== event.client_name) {
      updatePayload.display_id = await this.generateDisplayId(updateEventDto.client_name);
    }

    if (updateEventDto.status) {
      updatePayload.status = updateEventDto.status;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    const { data, error } = await this.supabase
      .from('events')
      .update(updatePayload)
      .eq('id', event.id)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update event: ${error.message}`);

    return data;
  }

  private async updateEventStatus(eventId: string, newStatus: EventStatus, actorId: string) {
    const { data, error } = await this.supabase.rpc('update_event_status', {
      p_event_id: eventId,
      p_new_status: newStatus,
      p_actor_id: actorId,
      p_actor_role: 'admin',
    });

    if (error) {
      if (error.message?.includes('not found')) throw new NotFoundException('Event not found');
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async deleteEvent(id: string, role: UserRole, actorId: string) {
    const event = await this.getEventOrThrow(id, this.VALIDATION_FIELDS);

    if (event.status === EventStatus.FINISHED) {
      const canDelete = event.created_by === actorId || role === UserRole.ADMIN;
      if (!canDelete) throw new ForbiddenException('Only the creator or admin can delete finished events');
    }

    const { error } = await this.supabase.from('events').delete().eq('id', event.id);
    if (error) throw new BadRequestException(`Failed to delete event: ${error.message}`);
  }

  private async generateDisplayId(clientName: string): Promise<string> {
    const parts = clientName.trim().split(/\s+/).filter(p => p.length > 0);
    
    // Take first character from each name part (first, middle, last)
    let initials: string;
    if (parts.length === 1) {
      // Single name: take first 2 characters
      initials = parts[0].substring(0, 2).toUpperCase();
    } else if (parts.length === 2) {
      // Two names: first + last initial
      initials = `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    } else {
      // Three or more names: first + middle + last initial
      const first = parts[0].charAt(0).toUpperCase();
      const middle = parts.slice(1, -1).map(p => p.charAt(0).toUpperCase()).join('');
      const last = parts[parts.length - 1].charAt(0).toUpperCase();
      initials = `${first}${middle}${last}`;
    }

    const { data: existing } = await this.supabase
      .from('events')
      .select('display_id')
      .like('display_id', `${initials}-%`)
      .order('display_id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existing?.length) {
      const lastNumber = parseInt(existing[0].display_id.split('-')[1]);
      if (!isNaN(lastNumber) && lastNumber < 1000) nextNumber = lastNumber + 1;
    }

    // Use 3 digits for 3+ initials, 2 digits for 2 initials
    const padLength = initials.length >= 3 ? 3 : 2;
    return `${initials}-${nextNumber.toString().padStart(padLength, '0')}`;
  }
}
