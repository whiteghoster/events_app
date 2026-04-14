import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventProductsService } from './event-products.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventProductDto } from './dto/create-event-product.dto';
import { UpdateEventProductDto } from './dto/update-event-product.dto';
import { CloseEventDto } from './dto/close-event.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventProductsService: EventProductsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventsService.createEvent(createEventDto, user.id);
    return { success: true, data };
  }

  @Get()
  async findAllEvents(
    @Query('tab') tab?: string,
    @Query('occasionType') occasionType?: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    const result = await this.eventsService.findEvents(
      tab,
      occasionType,
      pagination.page,
      pagination.pageSize,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  async findEventById(@Param('id') id: string) {
    const data = await this.eventsService.findEventById(id);
    return { success: true, data };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventsService.updateEvent(id, updateEventDto, user.role, user.id);
    return { success: true, data };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async transitionStatus(
    @Param('id') id: string,
    @Body() closeEventDto: CloseEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventsService.transitionStatus(id, closeEventDto.status, user.id);
    return { success: true, data, message: `Event moved to ${closeEventDto.status}` };
  }

  @Post(':id/products')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createEventProduct(
    @Param('id') eventId: string,
    @Body() dto: CreateEventProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventProductsService.createEventProduct(
      { ...dto, event_id: eventId },
      user.role,
      user.id,
    );
    return { success: true, data };
  }

  @Get(':id/products')
  async findEventProducts(
    @Param('id') eventId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    const result = await this.eventProductsService.findEventProducts(
      eventId,
      pagination.page,
      pagination.pageSize,
    );
    return { success: true, ...result };
  }

  @Put(':id/products/:eventProductId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.STAFF_MEMBER)
  async updateEventProduct(
    @Param('eventProductId', ParseUUIDPipe) eventProductId: string,
    @Body() dto: UpdateEventProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventProductsService.updateEventProduct(eventProductId, dto, user.role, user.id);
    return { success: true, data };
  }

  @Delete(':id/products/:eventProductId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteEventProduct(
    @Param('eventProductId', ParseUUIDPipe) eventProductId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.eventProductsService.deleteEventProduct(eventProductId, user.role, user.id);
    return { success: true, message: 'Event product deleted successfully' };
  }

  @Get(':id/category-summary')
  async getCategorySummary(@Param('id') eventId: string) {
    const data = await this.eventProductsService.getCategorySummary(eventId);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteEvent(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.eventsService.deleteEvent(id, user.id);
    return { success: true, data };
  }
}
