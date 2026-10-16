import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';

interface NotificationQueryOptions {
  page?: number | string;
  limit?: number | string;
}

interface CreateNotificationInput {
  userId: string;
  type?: 'CONTRACT' | 'MESSAGE' | 'GENERAL' | 'SYSTEM';
  title: string;
  body: string;
  link?: string | null;
}

export class NotificationService {
  /** Internal helper — not exposed directly via a public endpoint. Always
   * called with an explicit, server-determined userId (e.g. a contract's
   * owning client), never a client-supplied one. */
  static async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type || 'GENERAL',
        title: input.title,
        body: input.body,
        link: input.link || null,
      },
    });
  }

  static async findMine(userId: string, options: NotificationQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: notifications, pagination: createPaginationResult(total, page, limit) };
  }

  static async unreadCount(userId: string) {
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  static async markAsRead(id: string, userId: string) {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { success: true };
  }
}
