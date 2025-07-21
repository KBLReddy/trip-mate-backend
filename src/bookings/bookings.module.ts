// src/bookings/bookings.module.ts
import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { ToursModule } from '../tours/tours.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ToursModule, NotificationsModule], // Import NotificationsModule for NotificationsService
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
