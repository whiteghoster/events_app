import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, DatabaseService],
  exports: [EventsService],
})
export class EventsModule { }