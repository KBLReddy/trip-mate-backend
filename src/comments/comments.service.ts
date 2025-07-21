// src/comments/comments.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService, // Injected for notification creation
  ) {}

  async create(
    postId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        postId,
        userId,
      },
      include: {
        user: true,
      },
    });

    // Create notification for post author
    if (post.userId !== userId) {
      const commenter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await this.notificationsService.createNotification({
        userId: post.userId,
        type: 'POST_COMMENTED',
        title: 'New comment on your post',
        content: `${commenter?.name} commented on your post "${post.title}"`,
        relatedId: postId,
      });
    }

    return new CommentResponseDto(comment);
  }

  async findByPost(postId: string, page: number = 1, limit: number = 10) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      data: comments.map(comment => new CommentResponseDto(comment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(commentId: string, userId: string, userRole: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Allow deletion if user is the author or an admin
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}