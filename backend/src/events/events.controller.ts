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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventProductDto } from './dto/create-event-product.dto';
import { UpdateEventProductDto } from './dto/update-event-product.dto';
import { CloseEventDto } from './dto/close-event.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  // ========== EVENTS ==========

  @Post()
  @Roles(UserRole.ADMIN)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.eventsService.createEvent(createEventDto, user.id),
    };
  }

  @Get()
  async findAllEvents(
    @Query('tab') tab?: string,
    @Query('occasionType') occasionType?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const result = await this.eventsService.findEvents(
      tab,
      occasionType,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async findEventById(@Param('id') id: string) {
    return {
      success: true,
      data: await this.eventsService.findEventById(id),
    };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.eventsService.updateEvent(id, updateEventDto, user.role, user.id),
    };
  }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN)
  async closeEvent(
    @Param('id') id: string,
    @Body() closeEventDto: CloseEventDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.eventsService.closeEvent(id, closeEventDto.status, user.role, user.id),
      message: `Event moved to ${closeEventDto.status} successfully`,
    };
  }

  // ========== EVENT PRODUCTS ==========

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
        user.role,
        user.id,
      ),
    };
  }

  @Get(':id/products')
  async findEventProducts(
    @Param('id') eventId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const result = await this.eventsService.findEventProducts(
      eventId,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
    return {
      success: true,
      ...result,
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
    return {
      success: true,
      data: await this.eventsService.updateEventProduct(
        rowId,
        updateEventProductDto,
        user.role,
        user.id,
      ),
    };
  }

  @Delete(':id/products/:rowId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteEventProduct(
    @Param('id') eventId: string,
    @Param('rowId') rowId: string,
    @CurrentUser() user: any,
  ) {
    await this.eventsService.deleteEventProduct(rowId, user.role, user.id);
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

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.eventsService.deleteEvent(id, user.role, user.id),
    };
  }
}