import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { DatabaseService } from '../database/database.service';

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [CatalogController],
  providers: [CatalogService, DatabaseService],
  exports: [CatalogService],
})
export class CatalogModule { }