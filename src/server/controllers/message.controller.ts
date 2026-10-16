import { Request, Response } from 'express';
import { asyncHandler } from '../core/validators/async-handler';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { MessageService } from '../services/message.service';
import { CreateMessageSchema, MessageListQuerySchema, UpdateMessageSchema } from '../types/message.schema';

export class MessageController {
  static getMessages = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = MessageListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    const result = await MessageService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getMessageById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    const message = await MessageService.findById(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, message);
  });

  static createMessage = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    const message = await MessageService.create(validationResult.data, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, message, 'Message submitted successfully', 201);
  });

  static updateMessage = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    if (!req.user?.userId) throw ApiError.unauthorized();

    const message = await MessageService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, message, 'Message updated successfully');
  });

  static deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    await MessageService.remove(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'Message deleted successfully');
  });

  static getServiceOptions = asyncHandler(async (_req: Request, res: Response) => {
    const services = await MessageService.findServiceOptions();
    return sendSuccess(res, services);
  });
}
