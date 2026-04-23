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

  async getEventOrThrow(eventId: string) {
    let query = this.supabase
      .from('events')
      .select('*');

    // Check if it's a display ID (format: 2 letters + hyphen + 2 digits, e.g., JD-01)
    const displayIdPattern = /^[A-Z]{2}-\d{2}$/;
    if (displayIdPattern.test(eventId) || eventId.startsWith('EVT-')) {
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

  enforceEventEditPermission(event: any, role: UserRole, actorId: string) {
    if (event.status === EventStatus.FINISHED) {
      // Only creator or admin can modify finished events
      const isCreator = event.created_by === actorId;
      const isAdmin = role === UserRole.ADMIN;
      if (!isCreator && !isAdmin) {
        throw new ForbiddenException('Finished events are read-only');
      }
    }
    if (event.status === EventStatus.HOLD && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can edit hold events');
    }
  }

  canDeleteFinishedEvent(event: any, role: UserRole, actorId: string): boolean {
    if (event.status !== EventStatus.FINISHED) {
      return true; // Non-finished events can be deleted by authorized users
    }
    // For finished events, only creator or admin can delete
    const isCreator = event.created_by === actorId;
    const isAdmin = role === UserRole.ADMIN;
    return isCreator || isAdmin;
  }

  private async generateDisplayId(clientName: string): Promise<string> {
    // Parse client name to get initials
    const nameParts = clientName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    
    let initials: string;
    if (lastName) {
      // If last name exists, use first letter of first and last name
      initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else {
      // If only first name, use first 2 letters
      initials = firstName.substring(0, 2).toUpperCase();
    }

    // Query existing events for this client to get the next sequential number
    const { data: existingEvents } = await this.supabase
      .from('events')
      .select('display_id')
      .like('display_id', `${initials}-%`)
      .order('display_id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existingEvents && existingEvents.length > 0) {
      const lastDisplayId = existingEvents[0].display_id;
      const lastNumber = parseInt(lastDisplayId.split('-')[1]);
      if (!isNaN(lastNumber) && lastNumber < 1000) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format as JD-01, JO-01, etc.
    const displayId = `${initials}-${nextNumber.toString().padStart(2, '0')}`;
    return displayId;
  }

  async createEvent(createEventDto: CreateEventDto, actorId: string) {
    const payload = {
      client_name: createEventDto.client_name,
      company_name: createEventDto.company_name,
      contact_phone: createEventDto.contact_phone,
      event_date: createEventDto.event_date,
      venue: createEventDto.venue,
      venue_address: createEventDto.venue_address,
      city: createEventDto.city,
      head_karigar_name: createEventDto.head_karigar_name,
      manager_name: createEventDto.manager_name,
      delivery_from_date: createEventDto.delivery_from_date,
      delivery_to_date: createEventDto.delivery_to_date,
      display_id: await this.generateDisplayId(createEventDto.client_name),
      created_by: actorId,
    };

    const { data, error } = await this.supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }

    // Fire and forget audit log for better performance
    this.auditService.createLog({
      entity_type: 'Event',
      entity_id: data.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: data,
    }).catch(err => console.error('Audit log failed:', err));

    return data;
  }

  async findEvents(
    occasionType?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const offset = paginationOffset(page, pageSize);

    let query = this.supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: true });

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

  async getUniqueClients() {
    const { data, error } = await this.supabase
      .from('events')
      .select('client_name, company_name, contact_phone')
      .order('client_name', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to fetch clients: ${error.message}`);
    }

    // Get unique clients by client_name (filter out null/empty values)
    const uniqueClients = new Map();
    data?.forEach(event => {
      if (event.client_name && event.client_name.trim() && !uniqueClients.has(event.client_name)) {
        uniqueClients.set(event.client_name, {
          client_name: event.client_name,
          company_name: event.company_name,
          contact_phone: event.contact_phone,
        });
      }
    });

    return Array.from(uniqueClients.values());
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, role: UserRole, actorId: string) {
    const event = await this.getEventOrThrow(id);

    // Handle status transition if status is in the payload
    if (updateEventDto.status) {
      const currentStatus = (event.status as EventStatus) || EventStatus.LIVE;
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(updateEventDto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${currentStatus} to ${updateEventDto.status}`,
        );
      }
    } else {
      this.enforceEventEditPermission(event, role, actorId);
    }

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

    // Build the final update payload
    const updatePayload: Record<string, any> = { ...fieldPayload };

    // Regenerate display_id if client_name is being updated
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

    if (error) {
      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }

    // Fire and forget audit log for better performance
    this.auditService.createLog({
      entity_type: 'Event',
      entity_id: event.id,
      action: AuditAction.UPDATE,
      user_id: actorId,
      old_values: updateEventDto.status ? { status: event.status } : event,
      new_values: updateEventDto.status ? { status: updateEventDto.status } : data,
    }).catch(err => console.error('Audit log failed:', err));

    return data;
  }

  async deleteEvent(id: string, role: UserRole, actorId: string) {
    const event = await this.getEventOrThrow(id);

    // Check permissions for deleting finished events
    if (!this.canDeleteFinishedEvent(event, role, actorId)) {
      throw new ForbiddenException('Only the creator or admin can delete finished events');
    }

    const { error } = await this.supabase.from('events').delete().eq('id', event.id);

    if (error) {
      throw new BadRequestException(`Failed to delete event: ${error.message}`);
    }

    // Fire and forget audit log for better performance
    this.auditService.createLog({
      entity_type: 'Event',
      entity_id: event.id,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: event,
    }).catch(err => console.error('Audit log failed:', err));
  }
}
