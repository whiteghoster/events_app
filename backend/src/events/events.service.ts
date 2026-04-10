import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventStatus } from '../auth/enums/event-status.enum';
import { OccasionType } from '../auth/enums/occasion-type.enum';
import { UserRole } from '../auth/enums/user-role.enum';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(OccasionType)
  occasionType?: OccasionType;

  @IsOptional()
  @IsEnum(OccasionType)
  occasion_type?: OccasionType;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  venueName?: string;

  @IsOptional()
  @IsString()
  venue_name?: string;

  @IsOptional()
  @IsString()
  venueAddress?: string;

  @IsOptional()
  @IsString()
  venue_address?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(OccasionType)
  occasionType?: OccasionType;

  @IsOptional()
  @IsEnum(OccasionType)
  occasion_type?: OccasionType;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  venueName?: string;

  @IsOptional()
  @IsString()
  venue_name?: string;

  @IsOptional()
  @IsString()
  venueAddress?: string;

  @IsOptional()
  @IsString()
  venue_address?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class CreateEventProductDto {
  @IsUUID()
  event_id: string;

  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}

export class UpdateEventProductDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}

export class CloseEventDto {
  @IsEnum(EventStatus)
  @IsNotEmpty()
  status: EventStatus;
}

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.LIVE]: [EventStatus.HOLD],
  [EventStatus.HOLD]: [EventStatus.FINISHED],
  [EventStatus.FINISHED]: [],
};

@Injectable()
export class EventsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  private normalizeEventDto(dto: CreateEventDto | UpdateEventDto) {
    return {
      name: (dto as any).name,
      occasion_type: (dto as any).occasionType || (dto as any).occasion_type,
      date: (dto as any).eventDate || (dto as any).date,
      venue_name: (dto as any).venueName || (dto as any).venue_name,
      venue_address: (dto as any).venueAddress || (dto as any).venue_address,
      contact_person: (dto as any).contactName || (dto as any).contact_person,
      contact_phone: (dto as any).contactPhone || (dto as any).contact_phone,
      notes: (dto as any).notes,
    };
  }

  private async getEventOrThrow(eventId: string) {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

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

  async createEvent(createEventDto: CreateEventDto, userId: string) {
    const payload = this.normalizeEventDto(createEventDto);

    if (!payload.name || !payload.occasion_type || !payload.date || !payload.venue_name) {
      throw new BadRequestException(
        'Missing required event fields: name, occasion type, date, and venue name are required',
      );
    }

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

    return data;
  }

  async findEvents(tab?: string, occasionType?: string) {
    let query = this.supabase.from('events').select('*');

    if (tab === 'live') {
      query = query.eq('status', EventStatus.LIVE).order('date', { ascending: true });
    } else if (tab === 'over') {
      query = query
        .in('status', [EventStatus.HOLD, EventStatus.FINISHED])
        .order('closed_at', { ascending: false });
    } else {
      query = query.eq('status', EventStatus.LIVE).order('date', { ascending: true });
    }

    if (occasionType) {
      query = query.eq('occasion_type', occasionType);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch events: ${error.message}`);
    }

    return data ?? [];
  }

  async findEventById(id: string) {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Event not found');
    }

    return data;
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, userId: string, role: UserRole) {
    const event = await this.getEventOrThrow(id);
    this.enforceEventEditPermission(event, role);

    if (updateEventDto.status) {
      throw new BadRequestException('Use /events/:id/close for status transitions');
    }

    const payload = this.normalizeEventDto(updateEventDto);

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

    return data;
  }

  async closeEvent(id: string, newStatus: EventStatus, userId: string, role: UserRole) {
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

    // live -> hold requires at least one product row
    if (event.status === EventStatus.LIVE && newStatus === EventStatus.HOLD) {
      const { count, error: countError } = await this.supabase
        .from('event_products')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id);

      if (countError) {
        throw new BadRequestException('Failed to validate event product rows');
      }

      if (!count || count < 1) {
        throw new ConflictException(
          'Cannot move event to hold without at least one product row',
        );
      }
    }

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

    return data;
  }

  async createEventProduct(
    createEventProductDto: CreateEventProductDto,
    userId: string,
    role: UserRole,
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

    return data;
  }

  async findEventProducts(eventId: string) {
    await this.getEventOrThrow(eventId);

    const { data, error } = await this.supabase
      .from('event_products')
      .select(`
        *,
        product:products (
          id,
          name,
          default_unit,
          is_active,
          category:categories (
            id,
            name
          )
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to fetch event products: ${error.message}`);
    }

    return data ?? [];
  }

  async updateEventProduct(
    rowId: string,
    updateEventProductDto: UpdateEventProductDto,
    userId: string,
    role: UserRole,
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

    this.ensurePayloadNotEmpty(cleanPayload, 'No valid event product fields provided for update');

    if (role === UserRole.STAFF_MEMBER) {
      const allowedKeys = ['quantity', 'unit'];
      const attemptedKeys = Object.keys(cleanPayload);
      const invalidKeys = attemptedKeys.filter((k) => !allowedKeys.includes(k));

      if (invalidKeys.length > 0) {
        throw new ForbiddenException(
          'Staff Members can only update quantity and unit',
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

    return data;
  }

  async deleteEventProduct(rowId: string, userId: string, role: UserRole) {
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

    return true;
  }

  async getCategorySummary(eventId: string) {
    await this.getEventOrThrow(eventId);

    const { data, error } = await this.supabase
      .from('event_products')
      .select(`
        quantity,
        unit,
        product:products (
          id,
          name,
          category:categories (
            id,
            name
          )
        )
      `)
      .eq('event_id', eventId);

    if (error) {
      throw new BadRequestException(`Failed to fetch category summary: ${error.message}`);
    }

    const summaryMap: Record<string, Record<string, number>> = {};

    for (const row of data ?? []) {
      const product = row.product as any;
      const categoryName = product?.category?.name || product?.categories?.name || 'Uncategorized';
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
}