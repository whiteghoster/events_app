import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateSupabaseConfig } from './config/database.config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    // Validate Supabase configuration
    validateSupabaseConfig();
    logger.log('✅ Supabase configuration validated');

    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    logger.log('✅ Global validation pipe configured');

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());
    logger.log('✅ Global exception filter configured');

    // CORS configuration — allow both local dev and production
    const frontendUrl = process.env.FRONTEND_URL;
    const corsOrigin = [
      'https://events-app-seven-flax.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    if (frontendUrl) {
      corsOrigin.push(frontendUrl);
      // Also add without trailing slash just in case
      if (frontendUrl.endsWith('/')) {
        corsOrigin.push(frontendUrl.slice(0, -1));
      }
    }

    app.enableCors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    });
    logger.log(`✅ CORS enabled for origins: ${corsOrigin.join(', ')}`);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') || 3002; // ✅ Default to 3002
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log(`🚀 Event Management API listening on port ${port}`);
    logger.log(`📡 Environment: ${nodeEnv}`);
    logger.log(`🔐 CORS Origin: ${corsOrigin}`);
    logger.log(`📍 API: http://localhost:${port}`);
  } catch (error) {
    logger.error('❌ Application startup failed:');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

bootstrap();