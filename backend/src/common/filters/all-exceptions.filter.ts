import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global Exception Filter
 * Catches all unhandled exceptions and returns standardized error responses
 * Handles NestJS HTTP exceptions and database errors
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | number = 'INTERNAL_ERROR';

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message =
          (exceptionResponse as any).message || exception.message;
      } else {
        message = exception.message;
      }

      code = status;

      // Clear auth cookies on 401 Unauthorized
      if (status === HttpStatus.UNAUTHORIZED) {
        response.clearCookie('access_token');
        response.clearCookie('refresh_token');
      }
    }
    // Handle standard Error and database errors
    else if (exception instanceof Error) {
      const error = exception as any;
      message = exception.message;

      // Handle Postgres-specific errors
      if (error.code === '23505') {
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        code = 409;
        message = 'A record with this value already exists';
      } else if (error.code === '23503') {
        // Foreign key violation
        status = HttpStatus.BAD_REQUEST;
        code = 400;
        message = 'Invalid reference to related record';
      } else if (error.code === '23502') {
        // NOT NULL constraint violation
        status = HttpStatus.BAD_REQUEST;
        code = 400;
        message = 'Required field is missing';
      } else if (error.code) {
        code = error.code;
      }
    }

    // Ensure message is a string
    if (Array.isArray(message)) {
      message = message.join(', ');
    }

    // Log error
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${message}`);
    }

    // Send standardized error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      code,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }
}