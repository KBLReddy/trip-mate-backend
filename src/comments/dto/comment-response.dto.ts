// src/comments/dto/comment-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Comment, User } from '@prisma/client';

export class CommentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  avatar: string | null;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: CommentAuthorDto })
  author: CommentAuthorDto;

  constructor(comment: Comment & { user: User }) {
    this.id = comment.id;
    this.postId = comment.postId;
    this.userId = comment.userId;
    this.content = comment.content;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.author = {
      id: comment.user.id,
      name: comment.user.name,
      avatar: comment.user.avatar,
    };
  }
}
