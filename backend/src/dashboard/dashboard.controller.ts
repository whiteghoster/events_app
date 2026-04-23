import {
  Controller,
  Get,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { data };
  }
}
