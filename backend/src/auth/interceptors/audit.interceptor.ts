import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DatabaseService } from '../../database/database.service';

/**
 * Global Audit Interceptor
 * Automatically sets PostgreSQL audit context for every request
 * based on the authenticated user ID.
 *
 * This eliminates repetitive setUserId/clearUserId calls in service methods.
 * Handles cleanup automatically on both success and error.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly databaseService: DatabaseService) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const method = request.method;
    const path = request.path;

    // Only set audit context for mutation operations (POST, PUT, PATCH, DELETE)
    if (userId && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        await this.databaseService.setUserId(userId);
        this.logger.debug(
          `📝 Audit context set for user ${userId} on ${method} ${path}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to set audit context: ${(error as Error).message}`,
        );
        // Non-blocking: request should continue even if audit setup fails
      }
    }

    return next.handle().pipe(
      tap(() => {
        // Clear audit context after successful request
        if (userId && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.databaseService.clearUserId().catch((error) => {
            this.logger.warn(
              `Failed to clear audit context: ${(error as Error).message}`,
            );
          });
        }
      }),
      catchError((error) => {
        // Clear audit context even on error
        if (userId && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.databaseService.clearUserId().catch((err) => {
            this.logger.error(
              `Failed to clear audit context on error: ${(err as Error).message}`,
            );
          });
        }
        throw error;
      }),
    );
  }
}