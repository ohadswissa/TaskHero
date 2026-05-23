import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '@/database';

const MAX_NOTIFICATIONS_PER_POLL = 50;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch the most recent notifications for a user, optionally filtered to
   * those created strictly after `since`. Hard-capped at 50 rows.
   *
   * Ordered by createdAt desc so newest items are first; clients use the
   * server-supplied serverTime as the next `since` to avoid clock skew.
   */
  async findMine(userId: string, since?: Date): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_NOTIFICATIONS_PER_POLL,
    });
  }

  /**
   * Mark a set of notifications as read. Only rows owned by `userId` are
   * affected — supplying foreign ids is a silent no-op (no leak). Returns
   * the count of rows updated. Already-read rows are left untouched.
   */
  async markRead(userId: string, notificationIds: string[]): Promise<{ updated: number }> {
    if (notificationIds.length === 0) {
      return { updated: 0 };
    }
    const now = new Date();
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        readAt: null,
      },
      data: { readAt: now, isRead: true },
    });
    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} notifications read for user ${userId}`);
    }
    return { updated: result.count };
  }
}
