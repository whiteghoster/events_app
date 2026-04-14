import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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
    const result = await this.auditService.findAll(dto);
    return { success: true, data: result.data, pagination: result.pagination };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    const data = await this.auditService.findById(id);
    return { success: true, data };
  }

  @Post('export')
  @Roles(UserRole.ADMIN)
  async exportAuditLogs(@Body() dto: FindAuditLogsDto) {
    const result = await this.auditService.exportAuditLogs(dto);
    return { success: true, data: result.logs, filename: result.filename };
  }
}
