// src/posts/dto/post-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Post, User } from '@prisma/client';

export class PostAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  avatar: string | null;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: PostAuthorDto })
  author: PostAuthorDto;

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  isLikedByCurrentUser: boolean;

  constructor(post: Post & { 
    user: User; 
    _count?: { comments: number };
    likedBy?: Array<{ userId: string }>;
  }, currentUserId?: string) {
    this.id = post.id;
    this.userId = post.userId;
    this.title = post.title;
    this.content = post.content;
    this.imageUrl = post.imageUrl;
    this.likes = post.likes;
    this.createdAt = post.createdAt;
    this.updatedAt = post.updatedAt;
    this.author = {
      id: post.user.id,
      name: post.user.name,
      email: post.user.email,
      avatar: post.user.avatar,
    };
    this.commentCount = post._count?.comments || 0;
    this.isLikedByCurrentUser = currentUserId 
      ? (post.likedBy?.some(like => like.userId === currentUserId) || false)
      : false;
  }
}