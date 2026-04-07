import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { AuditService, FindAuditLogsDto, AuditLogResult } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() findAuditLogsDto: FindAuditLogsDto) {
    try {
      const result = await this.auditService.findAll(findAuditLogsDto);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    try {
      const auditLog = await this.auditService.findById(id);
      if (!auditLog) {
        throw new HttpException('Audit log not found', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: auditLog,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch audit log',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('export')
  @Roles(UserRole.ADMIN)
  async exportAuditLogs(@Body() findAuditLogsDto: FindAuditLogsDto) {
    try {
      const result = await this.auditService.exportAuditLogs(findAuditLogsDto);
      
      return {
        success: true,
        data: result.data.logs,
        filename: result.data.filename,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to export audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
