import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventProductsService } from './event-products.service';
import { EventContractorsService } from './event-contractors.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventProductDto } from './dto/create-event-product.dto';
import { UpdateEventProductDto } from './dto/update-event-product.dto';
import { AddEventContractorDto, SyncEventContractorsDto } from './dto/event-contractor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, EventStatus } from '../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventProductsService: EventProductsService,
    private readonly eventContractorsService: EventContractorsService,
  ) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventsService.createEvent(createEventDto, user.id);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: EventQueryDto,
  ) {
    return await this.eventsService.findEvents(
      query.status,
      query.page,
      query.page_size,
    );
  }

  @Get('clients')
  @Public()
  @Header('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  async getClients() {
    const data = await this.eventsService.getUniqueClients();
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.eventsService.findEventById(id);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventsService.updateEvent(id, updateEventDto, user.role, user.id);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.eventsService.deleteEvent(id, user.role, user.id);
  }

  // ── Event Products ──

  @Post(':id/products')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async addProduct(
    @Param('id') eventId: string,
    @Body() dto: CreateEventProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventProductsService.createEventProduct(
      { ...dto, event_id: eventId },
      user.role,
      user.id,
    );
    return { data };
  }

  @Get(':id/products')
  async findProducts(
    @Param('id') eventId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.eventProductsService.findEventProducts(
      eventId,
      pagination.page,
      pagination.page_size,
    );
  }

  @Patch(':id/products/:eventProductId')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async updateProduct(
    @Param('eventProductId', ParseUUIDPipe) eventProductId: string,
    @Body() dto: UpdateEventProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.eventProductsService.updateEventProduct(eventProductId, dto, user.role, user.id);
    return { data };
  }

  @Delete(':id/products/:eventProductId')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProduct(
    @Param('eventProductId', ParseUUIDPipe) eventProductId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.eventProductsService.deleteEventProduct(eventProductId, user.role, user.id);
  }

  @Get(':id/products/summary')
  async productsSummary(@Param('id') eventId: string) {
    const data = await this.eventProductsService.getCategorySummary(eventId);
    return { data };
  }

  // ── Event Contractors ──

  @Get(':id/contractors')
  @Roles(UserRole.ADMIN, UserRole.KARIGAR, UserRole.MANAGER)
  async findContractors(@Param('id') eventId: string) {
    const data = await this.eventContractorsService.findAllByEvent(eventId);
    return { data };
  }

  @Post(':id/contractors')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addContractor(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: AddEventContractorDto,
  ) {
    const data = await this.eventsService.addEventContractor(eventId, dto);
    return { data };
  }

  @Put(':id/contractors')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async syncContractors(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: SyncEventContractorsDto,
  ) {
    const data = await this.eventContractorsService.syncEventContractors(
      eventId,
      dto.contractors,
      {
        workFrom: dto.workFrom,
        workTo: dto.workTo,
      },
    );
    return { data };
  }
}
