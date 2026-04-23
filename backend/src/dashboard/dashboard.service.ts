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
      
      // Run all count queries in parallel for better performance
      const [
        { count: totalEvents, error: eventsError },
        { count: activeEvents, error: activeEventsError },
        { count: holdEvents, error: holdEventsError },
        { count: finishedEvents, error: finishedEventsError },
        { count: totalUsers, error: usersError },
        { count: activeUsers, error: activeUsersError },
        { count: inactiveUsers, error: inactiveUsersError },
        { count: totalProducts, error: productsError },
        { count: activeProducts, error: activeProductsError },
        { count: inactiveProducts, error: inactiveProductsError },
        { count: totalCategories, error: categoriesError },
      ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'live'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'hold'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
      ]);

      // Check for errors
      const errors = [
        eventsError, activeEventsError, holdEventsError, finishedEventsError,
        usersError, activeUsersError, inactiveUsersError,
        productsError, activeProductsError, inactiveProductsError,
        categoriesError,
      ].filter(Boolean);

      if (errors.length > 0) {
        this.logger.error('Database errors:', errors);
        throw new Error('Failed to fetch some dashboard stats');
      }

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
