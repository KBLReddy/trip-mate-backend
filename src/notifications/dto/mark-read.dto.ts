// src/notifications/dto/mark-read.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class MarkReadDto {
  @ApiProperty({ 
    type: [String], 
    description: 'Array of notification IDs to mark as read. If empty, marks all as read.',
    required: false 
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  notificationIds?: string[];
}