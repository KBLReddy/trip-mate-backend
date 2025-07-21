// src/posts/dto/update-post.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
