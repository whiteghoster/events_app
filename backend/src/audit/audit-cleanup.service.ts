import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  /**
   * Run daily at midnight to delete audit logs older than 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldAuditLogs(): Promise<void> {
    try {
      const { error, count } = await this.supabase
        .from('audit_log')
        .delete({ count: 'exact' })
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        this.logger.error(`Failed to cleanup old audit logs: ${error.message}`);
        return;
      }

      const deletedCount = count || 0;
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} audit logs older than 30 days`);
      } else {
        this.logger.debug('No old audit logs to cleanup');
      }
    } catch (err) {
      this.logger.error(`Unexpected error during audit cleanup: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}
