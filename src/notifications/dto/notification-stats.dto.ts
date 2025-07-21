// src/notifications/dto/notification-stats.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class NotificationStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;

  @ApiProperty()
  read: number;

  @ApiProperty({
    description: 'Count by notification type',
    example: { BOOKING_CONFIRMED: 5, POST_LIKED: 10 },
  })
  byType: Record<string, number>;
}
