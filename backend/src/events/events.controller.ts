import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  EventsService,
  CreateEventDto,
  UpdateEventDto,
  CreateEventProductDto,
  UpdateEventProductDto,
  CloseEventDto,
} from './events.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  // =========================
  // EVENTS
  // =========================

  @Post()
  @Roles(UserRole.ADMIN)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.eventsService.createEvent(
        createEventDto,
        user.sub || user.id,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create event',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAllEvents(
    @Query('tab') tab?: string,
    @Query('occasionType') occasionType?: string,
  ) {
    try {
      const events = await this.eventsService.findEvents(tab, occasionType);

      return {
        success: true,
        data: events,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findEventById(@Param('id') id: string) {
    try {
      const event = await this.eventsService.findEventById(id);
      if (!event) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: event,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    try {
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
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to update event',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN)
  async closeEvent(
    @Param('id') id: string,
    @Body() closeEventDto: CloseEventDto,
    @CurrentUser() user: any,
  ) {
    try {
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
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      if (error.message.includes('Cannot move event')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Failed to close event',
        HttpStatus.BAD_REQUEST,
      );
    }
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
    try {
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
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create event product',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/products')
  async findEventProducts(
    @Param('id') eventId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 20,
  ) {
    try {
      const result = await this.eventsService.findEventProducts(eventId, page, pageSize);
      return {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch event products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/products/:rowId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.STAFF_MEMBER)
  async updateEventProduct(
    @Param('id') eventId: string,
    @Param('rowId') rowId: string,
    @Body() updateEventProductDto: UpdateEventProductDto,
    @CurrentUser() user: any,
  ) {
    try {
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
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to update event product',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id/products/:rowId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteEventProduct(
    @Param('id') eventId: string,
    @Param('rowId') rowId: string,
    @CurrentUser() user: any,
  ) {
    try {
      await this.eventsService.deleteEventProduct(rowId, user.sub || user.id, user.role);

      return {
        success: true,
        message: 'Event product deleted successfully',
      };
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to delete event product',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/category-summary')
  async getCategorySummary(@Param('id') eventId: string) {
    try {
      return {
        success: true,
        data: await this.eventsService.getCategorySummary(eventId),
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch category summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}