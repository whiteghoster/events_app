import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateSupabaseConfig } from './config/database.config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    // Validate Supabase configuration
    validateSupabaseConfig();

    const app = await NestFactory.create(AppModule);

    app.use(compression());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    // CORS configuration from environment
    const corsOriginsEnv = process.env.CORS_ORIGINS;
    const corsOrigins = corsOriginsEnv
      ? corsOriginsEnv.split(',').map((origin) => origin.trim()).filter(Boolean)
      : true; // Allow all origins if CORS_ORIGINS not set

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') || 3002;

    await app.listen(port);
    logger.log(`Server listening on port ${port}`);
  } catch (error) {
    logger.error('Startup failed:', (error as Error).message);
    process.exit(1);
  }
}

bootstrap();