import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    const { page, limit } = req.query;
    const result = await NotificationService.findMine(req.user.userId, { page: page as string, limit: limit as string });
    return sendPaginated(res, result.data, result.pagination);
  });

  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    const result = await NotificationService.unreadCount(req.user.userId);
    return sendSuccess(res, result);
  });

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    const notification = await NotificationService.markAsRead(req.params.id as string, req.user.userId);
    return sendSuccess(res, notification);
  });

  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    const result = await NotificationService.markAllAsRead(req.user.userId);
    return sendSuccess(res, result);
  });
}
