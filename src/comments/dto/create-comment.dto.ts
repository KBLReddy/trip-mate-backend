// src/comments/dto/create-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post! Thanks for sharing.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
