// src/posts/dto/post-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PostSortBy {
  CREATED_AT = 'createdAt',
  LIKES = 'likes',
  COMMENTS = 'comments',
}

export class PostQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    required: false,
    enum: PostSortBy,
    default: PostSortBy.CREATED_AT,
  })
  @IsEnum(PostSortBy)
  @IsOptional()
  sortBy?: PostSortBy = PostSortBy.CREATED_AT;

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
