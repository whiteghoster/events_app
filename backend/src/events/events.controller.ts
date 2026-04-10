import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  EventsService,
  CreateEventDto,
  UpdateEventDto,
  CreateEventProductDto,
  UpdateEventProductDto,
} from './events.service';
import { CloseEventDto } from './dto/close-event.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { EventStatus } from '../auth/enums/event-status.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // =========================
  // EVENTS
  // =========================

  @Post()
  @Roles(UserRole.ADMIN)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.eventsService.createEvent(
      createEventDto,
      user.sub || user.id,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get()
  async findAllEvents(
    @Query('tab') tab?: string,
    @Query('occasionType') occasionType?: string,
  ) {
    const events = await this.eventsService.findEvents(tab, occasionType);

    return {
      success: true,
      data: events,
    };
  }

  @Get(':id')
  async findEventById(@Param('id') id: string) {
    const event = await this.eventsService.findEventById(id);

    return {
      success: true,
      data: event,
    };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    const event = await this.eventsService.updateEvent(
      id,
      updateEventDto,
      user.sub || user.id,
      user.role,
    );

    return {
      success: true,
      data: event,
    };
  }

  @Put(':id/close')
  @Roles(UserRole.ADMIN)
  async closeEvent(
    @Param('id') id: string,
    @Body() closeEventDto: CloseEventDto,
    @CurrentUser() user: any,
  ) {
    const event = await this.eventsService.closeEvent(
      id,
      closeEventDto.status,
      user.sub || user.id,
      user.role,
    );

    return {
      success: true,
      data: event,
      message: `Event moved to ${closeEventDto.status} successfully`,
    };
  }

  // =========================
  // EVENT PRODUCTS
  // =========================

  @Post(':id/products')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createEventProduct(
    @Param('id') eventId: string,
    @Body() createEventProductDto: CreateEventProductDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.eventsService.createEventProduct(
        {
          ...createEventProductDto,
          event_id: eventId,
        },
        user.sub || user.id,
        user.role,
      ),
    };
  }

  @Get(':id/products')
  async findEventProducts(@Param('id') eventId: string) {
    return {
      success: true,
      data: await this.eventsService.findEventProducts(eventId),
    };
  }

  @Put(':id/products/:rowId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.STAFF_MEMBER)
  async updateEventProduct(
    @Param('id') eventId: string,
    @Param('rowId') rowId: string,
    @Body() updateEventProductDto: UpdateEventProductDto,
    @CurrentUser() user: any,
  ) {
    const product = await this.eventsService.updateEventProduct(
      rowId,
      updateEventProductDto,
      user.sub || user.id,
      user.role,
    );

    return {
      success: true,
      data: product,
    };
  }

  @Delete(':id/products/:rowId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteEventProduct(
    @Param('id') eventId: string,
    @Param('rowId') rowId: string,
    @CurrentUser() user: any,
  ) {
    await this.eventsService.deleteEventProduct(rowId, user.sub || user.id, user.role);

    return {
      success: true,
      message: 'Event product deleted successfully',
    };
  }

  @Get(':id/category-summary')
  async getCategorySummary(@Param('id') eventId: string) {
    return {
      success: true,
      data: await this.eventsService.getCategorySummary(eventId),
    };
  }
}