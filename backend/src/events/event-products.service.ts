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
    createEventProductDto: CreateEventProductDto,
    role: UserRole,
    actorId: string,
  ) {
    const event = await this.eventsService.getEventOrThrow(createEventProductDto.event_id);
    this.eventsService.enforceEventEditPermission(event, role);

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
      .insert({ ...createEventProductDto, event_id: event.id })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create event product: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: data.id,
      action: AuditAction.CREATE,
      user_id: actorId,
      new_values: data,
    });

    return data;
  }

  async findEventProducts(eventId: string, page: number = 1, pageSize: number = 20) {
    const event = await this.eventsService.getEventOrThrow(eventId);

    const offset = paginationOffset(page, pageSize);

    const { data, count, error } = await this.supabase
      .from('event_products')
      .select(
        `*, product:products(id, name, default_unit, is_active, category:categories(id, name))`,
        { count: 'exact' },
      )
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new BadRequestException(`Failed to fetch event products: ${error.message}`);
    }

    return paginate(data, count, page, pageSize);
  }

  async updateEventProduct(
    eventProductId: string,
    updateEventProductDto: UpdateEventProductDto,
    role: UserRole,
    actorId: string,
  ) {
    const { data: row, error: rowError } = await this.supabase
      .from('event_products')
      .select('*')
      .eq('id', eventProductId)
      .single();

    if (rowError || !row) {
      throw new NotFoundException('Event product not found');
    }

    const event = await this.eventsService.getEventOrThrow(row.event_id);
    this.eventsService.enforceEventEditPermission(event, role);

    const cleanPayload = stripUndefined(updateEventProductDto as Record<string, any>);

    if (Object.keys(cleanPayload).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    if (role === UserRole.MANAGER) {
      const allowedKeys = ['quantity', 'unit'];
      const invalidKeys = Object.keys(cleanPayload).filter((k) => !allowedKeys.includes(k));
      if (invalidKeys.length > 0) {
        throw new ForbiddenException(
          `Managers can only update ${allowedKeys.join(', ')}`,
        );
      }
    }

    const { data, error } = await this.supabase
      .from('event_products')
      .update(cleanPayload)
      .eq('id', eventProductId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update event product: ${error.message}`);
    }

    await this.auditService.createLog({
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
    const { data: row, error: rowError } = await this.supabase
      .from('event_products')
      .select('*')
      .eq('id', eventProductId)
      .single();

    if (rowError || !row) {
      throw new NotFoundException('Event product not found');
    }

    const event = await this.eventsService.getEventOrThrow(row.event_id);
    this.eventsService.enforceEventEditPermission(event, role);

    const { error } = await this.supabase
      .from('event_products')
      .delete()
      .eq('id', eventProductId);

    if (error) {
      throw new BadRequestException(`Failed to delete event product: ${error.message}`);
    }

    await this.auditService.createLog({
      entity_type: 'Event Product',
      entity_id: eventProductId,
      action: AuditAction.DELETE,
      user_id: actorId,
      old_values: row,
    });

    return { message: 'Event product deleted successfully' };
  }

  async getCategorySummary(eventId: string) {
    const event = await this.eventsService.getEventOrThrow(eventId);

    const { data, error } = await this.supabase
      .from('event_products')
      .select(`quantity, unit, product:products(id, name, category:categories(id, name))`)
      .eq('event_id', event.id);

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
      totals: Object.entries(units).map(([unit, quantity]) => ({ unit, quantity })),
    }));
  }
}
