import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly databaseService: DatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const userId: string = user.sub || user.id;

    return new Observable((subscriber) => {
      this.databaseService
        .setUserId(userId)
        .then(() => {
          next
            .handle()
            .pipe(
              tap({
                finalize: () => {
                  this.databaseService.clearUserId().catch((err) => {
                    console.error('Failed to clear app.user_id:', err);
                  });
                },
              }),
            )
            .subscribe(subscriber);
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }
}
