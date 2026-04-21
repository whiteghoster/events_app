import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && res !== null
        ? (res as any).message || exception.message
        : exception.message;

      if (status === HttpStatus.UNAUTHORIZED) {
        response.clearCookie('access_token');
        response.clearCookie('refresh_token');
      }
    } else if (exception instanceof Error) {
      const error = exception as any;
      message = exception.message;

      if (error.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
      } else if (error.code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
      } else if (error.code === '23502') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Required field is missing';
      }
    }

    if (Array.isArray(message)) {
      message = message.join(', ');
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }
}
