import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DashboardStats {
  totalEvents: number;
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  activeEvents: number;
  holdEvents: number;
  finishedEvents: number;
  activeUsers: number;
  inactiveUsers: number;
  activeProducts: number;
  inactiveProducts: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getStats(): Promise<DashboardStats> {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      this.logger.error('Failed to fetch dashboard stats', error);
      throw error;
    }

    return data as DashboardStats;
  }
}
