// src/notifications/dto/notification-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class NotificationQueryDto {
  @ApiProperty({ enum: NotificationType, required: false })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isRead?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  limit?: number = 20;
}
