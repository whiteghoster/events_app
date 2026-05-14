import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventProductsService } from './event-products.service';
import { EventContractorsService } from './event-contractors.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [EventsController],
  providers: [EventsService, EventProductsService, EventContractorsService],
  exports: [EventsService],
})
export class EventsModule {}
