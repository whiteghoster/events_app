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
  [EventStatus.FINISHED]: [],
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

  async getEventOrThrow(eventId: string) {
    let query = this.supabase
      .from('events')
      .select('*, assigned_staff:users(name)');

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

  enforceEventEditPermission(event: any, role: UserRole) {
    if (event.status === EventStatus.FINISHED) {
      throw new ForbiddenException('Finished events are read-only');
    }
    if (event.status === EventStatus.HOLD && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can edit hold events');
    }
  }

  private async generateDisplayId(): Promise<string> {
    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const displayId = `EVT-${randomNum}`;

      const { data } = await this.supabase
        .from('events')
        .select('id')
        .eq('display_id', displayId)
        .maybeSingle();

      if (!data) return displayId;
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    return `EVT-${timestamp}`;
  }

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
      display_id: await this.generateDisplayId(),
      status: EventStatus.LIVE,
    };

    const { data, error } = await this.supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: data.id,
      action: AuditAction.CREATE,
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
    const offset = paginationOffset(page, pageSize);
    const normalizedTab = (tab || 'live').toLowerCase();

    let query = this.supabase
      .from('events')
      .select('*, assigned_staff:users(name)', { count: 'exact' });

    switch (normalizedTab) {
      case 'hold':
        query = query.eq('status', EventStatus.HOLD).order('closed_at', { ascending: false });
        break;
      case 'finished':
        query = query.eq('status', EventStatus.FINISHED).order('closed_at', { ascending: false });
        break;
      case 'over':
        query = query
          .in('status', [EventStatus.HOLD, EventStatus.FINISHED])
          .order('closed_at', { ascending: false });
        break;
      default:
        query = query.eq('status', EventStatus.LIVE).order('date', { ascending: true });
    }

    if (occasionType) {
      query = query.eq('occasion_type', occasionType);
    }

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch events: ${error.message}`);
    }

    return paginate(data, count, page, pageSize);
  }

  async findEventById(id: string) {
    return this.getEventOrThrow(id);
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, role: UserRole, actorId: string) {
    const event = await this.getEventOrThrow(id);
    this.enforceEventEditPermission(event, role);

    const cleanPayload = stripUndefined({
      name: updateEventDto.name,
      occasion_type: updateEventDto.occasion_type,
      date: updateEventDto.date,
      venue_name: updateEventDto.venue_name,
      venue_address: updateEventDto.venue_address,
      contact_person: updateEventDto.contact_person,
      contact_phone: updateEventDto.contact_phone,
      notes: updateEventDto.notes,
      assigned_to: updateEventDto.assigned_to,
    });

    if (Object.keys(cleanPayload).length === 0) {
      throw new BadRequestException('No valid event fields provided for update');
    }

    const { data, error } = await this.supabase
      .from('events')
      .update(cleanPayload)
      .eq('id', event.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: event.id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: event,
      new_values: data,
    });

    return data;
  }

  async transitionStatus(id: string, newStatus: EventStatus, actorId: string) {
    const event = await this.getEventOrThrow(id);

    const allowed = ALLOWED_TRANSITIONS[event.status as EventStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${event.status} to ${newStatus}`,
      );
    }

    const closedAt = newStatus === EventStatus.LIVE ? null : new Date().toISOString();

    const { data, error } = await this.supabase
      .from('events')
      .update({ status: newStatus, closed_at: closedAt })
      .eq('id', event.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update event status: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: event.id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: { status: event.status },
      new_values: { status: newStatus },
    });

    return data;
  }

  async deleteEvent(id: string, actorId: string) {
    const event = await this.getEventOrThrow(id);

    const { error } = await this.supabase.from('events').delete().eq('id', event.id);

    if (error) {
      throw new BadRequestException(`Failed to delete event: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Event',
      entity_id: event.id,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: event,
    });

    return { message: 'Event deleted successfully' };
  }
}
