// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with proper configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger configuration - only in non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TripMate API')
      .setDescription('Tour booking platform with community features')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('health', 'Health check endpoints')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('tours', 'Tour management endpoints')
      .addTag('bookings', 'Booking management endpoints')
      .addTag('posts', 'Community posts endpoints')
      .addTag('comments', 'Comments endpoints')
      .addTag('notifications', 'Notifications endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;

  // Important: Use '0.0.0.0' for Railway/Docker
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`🏥 Health check available at: /health`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger docs available at: /api/docs`);
  }
}
void bootstrap();
