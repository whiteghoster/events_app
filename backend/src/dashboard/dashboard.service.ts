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
    try {
      const supabase = this.databaseService.getClient();
      
      // Get total events
      const { count: totalEvents, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) throw eventsError;

      // Get events by status
      const { count: activeEvents, error: activeEventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live');

      if (activeEventsError) throw activeEventsError;

      const { count: holdEvents, error: holdEventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'hold');

      if (holdEventsError) throw holdEventsError;

      const { count: finishedEvents, error: finishedEventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'finished');

      if (finishedEventsError) throw finishedEventsError;

      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get users by status
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeUsersError) throw activeUsersError;

      const { count: inactiveUsers, error: inactiveUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      if (inactiveUsersError) throw inactiveUsersError;

      // Get total products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Get products by status
      const { count: activeProducts, error: activeProductsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeProductsError) throw activeProductsError;

      const { count: inactiveProducts, error: inactiveProductsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      if (inactiveProductsError) throw inactiveProductsError;

      // Get total categories
      const { count: totalCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      if (categoriesError) throw categoriesError;

      return {
        totalEvents: totalEvents || 0,
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalCategories: totalCategories || 0,
        activeEvents: activeEvents || 0,
        holdEvents: holdEvents || 0,
        finishedEvents: finishedEvents || 0,
        activeUsers: activeUsers || 0,
        inactiveUsers: inactiveUsers || 0,
        activeProducts: activeProducts || 0,
        inactiveProducts: inactiveProducts || 0,
      };
    } catch (error) {
      this.logger.error('Failed to fetch dashboard stats', error);
      throw error;
    }
  }
}
