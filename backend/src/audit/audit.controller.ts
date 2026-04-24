import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() dto: FindAuditLogsDto) {
    if (dto.format === 'csv') {
      const result = await this.auditService.exportAuditLogs(dto);
      return { data: result.logs, filename: result.filename };
    }

    const result = await this.auditService.findAll(dto);
    return { data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const data = await this.auditService.findById(id);
    return { data };
  }
}
