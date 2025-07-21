// src/users/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  createdAt: Date;
}
