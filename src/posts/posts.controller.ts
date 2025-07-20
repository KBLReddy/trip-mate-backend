// src/posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/optional-auth.decorator';
import { User } from '@prisma/client';

@ApiTags('posts')
@UseGuards(JwtAuthGuard) 
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully', type: PostResponseDto })
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostResponseDto> {
    return this.postsService.create(createPostDto, user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'List of posts' })
  async findAll(
    @Query() query: PostQueryDto,
    @CurrentUser() user?: User,
  ) {
    return this.postsService.findAll(query, user?.id);
  }

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiResponse({ status: 200, description: 'List of user posts' })
  async getUserPosts(
    @Param('userId') userId: string,
    @CurrentUser() user?: User,
  ) {
    return this.postsService.getUserPosts(userId, user?.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get post details' })
  @ApiResponse({ status: 200, description: 'Post details', type: PostResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: User,
  ): Promise<PostResponseDto> {
    return this.postsService.findOne(id, user?.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully', type: PostResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostResponseDto> {
    return this.postsService.update(id, updatePostDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.postsService.remove(id, user.id, user.role);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ liked: boolean; likes: number }> {
    return this.postsService.toggleLike(id, user.id);
  }
}