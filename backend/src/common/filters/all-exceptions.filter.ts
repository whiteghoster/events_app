import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | number = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        code = status;
      } else {
        message = exception.message;
        code = status;
      }

      // Phase 4: Session expiry (401) clears cookie
      if (status === HttpStatus.UNAUTHORIZED) {
        response.clearCookie('access_token'); // Typical Supabase token cookie
        message = 'Session expired or unauthorised';
      }

    } else if (exception instanceof Error) {
      const dbException = exception as any;
      message = exception.message;
      
      if (dbException.code) {
        // Postgres error code parsing mapping
        if (dbException.code === '23505') {
          status = HttpStatus.CONFLICT;
          code = 409;
          message = 'A record with this name already exists.';
        } else {
          code = dbException.code;
        }
      }
    }

    // Force single readable string format per Phase 4
    if (Array.isArray(message)) {
      message = message.join('. ');
    }

    // No stack traces are passed back!
    response.status(status).json({
      code,
      message,
    });
  }
}
