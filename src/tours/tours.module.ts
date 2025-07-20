// src/tours/tours.module.ts
import { Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';

@Module({
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService], // Export for use in bookings module later
})
export class ToursModule {}