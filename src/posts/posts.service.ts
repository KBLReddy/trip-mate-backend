// src/posts/posts.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService, // Injected for notification creation
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        userId,
      },
      include: {
        user: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    return new PostResponseDto(post, userId);
  }

  async findAll(query: PostQueryDto, currentUserId?: string) {
    const { search, userId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.PostWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    const skip = (page - 1) * limit;

    // Build orderBy based on sortBy
    let orderBy: any = {};
    if (sortBy === 'likes') {
      orderBy = { likes: sortOrder };
    } else if (sortBy === 'comments') {
      orderBy = { comments: { _count: sortOrder } };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: true,
          _count: {
            select: { comments: true },
          },
          likedBy: currentUserId ? {
            where: { userId: currentUserId },
            select: { userId: true },
          } : false,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts.map((post: any) => new PostResponseDto(post, currentUserId)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findOne(id: string, currentUserId?: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        _count: {
          select: { comments: true },
        },
        likedBy: currentUserId ? {
          where: { userId: currentUserId },
          select: { userId: true },
        } : false,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return new PostResponseDto(post as any, currentUserId);
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        user: true,
        _count: {
          select: { comments: true },
        },
        likedBy: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    return new PostResponseDto(updatedPost as any, userId);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Allow deletion if user is the author or an admin
    if (post.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id },
    });
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await this.prisma.$transaction([
        this.prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
        }),
      ]);

      return { liked: false, likes: post.likes - 1 };
    } else {
      // Like the post
      const [_, updatedPost] = await this.prisma.$transaction([
        this.prisma.postLike.create({
          data: {
            postId,
            userId,
          },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likes: { increment: 1 } },
        }),
      ]);

      // Create notification for post author
      if (post.userId !== userId) {
        const liker = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await this.notificationsService.createNotification({
          userId: post.userId,
          type: 'POST_LIKED',
          title: 'Someone liked your post',
          content: `${liker?.name} liked your post "${post.title}"`,
          relatedId: postId,
        });
      }

      return { liked: true, likes: post.likes + 1 };
    }
  }

  async getUserPosts(userId: string, currentUserId?: string) {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        _count: {
          select: { comments: true },
        },
        likedBy: currentUserId ? {
          where: { userId: currentUserId },
          select: { userId: true },
        } : false,
      },
    });

    return posts.map((post: any) => new PostResponseDto(post, currentUserId));
  }
}