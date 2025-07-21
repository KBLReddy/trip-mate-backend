// src/notifications/dto/notification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ nullable: true })
  relatedId: string | null;

  @ApiProperty()
  createdAt: Date;
}
