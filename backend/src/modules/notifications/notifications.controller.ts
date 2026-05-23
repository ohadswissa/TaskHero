import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import {
  GetNotificationsQueryDto,
  GetNotificationsResponseDto,
  MarkNotificationsReadDto,
  MarkNotificationsReadResponseDto,
} from './dto';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHILD, UserRole.PARENT)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('mine')
  @ApiOperation({
    summary:
      'Poll for current user notifications. Pass last response `serverTime` as `since` to fetch only new items.',
  })
  @ApiResponse({ status: 200, description: 'Up to 50 newest notifications + serverTime echo' })
  async getMine(
    @CurrentUser('userId') userId: string,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<GetNotificationsResponseDto> {
    const since = query.since ? new Date(query.since) : undefined;
    const rows = await this.notificationsService.findMine(userId, since);
    return {
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      serverTime: new Date().toISOString(),
    };
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark a set of notifications as read (max 50 ids per call)' })
  @ApiResponse({ status: 201, description: 'Count of rows updated' })
  async markRead(
    @CurrentUser('userId') userId: string,
    @Body() dto: MarkNotificationsReadDto,
  ): Promise<MarkNotificationsReadResponseDto> {
    return this.notificationsService.markRead(userId, dto.ids);
  }
}
