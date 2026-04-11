import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, DatabaseService],
  exports: [CatalogService],
})
export class CatalogModule { }