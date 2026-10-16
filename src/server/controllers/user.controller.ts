import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { UserService } from '../services/user.service';
import { CreateUserSchema, UpdatePasswordSchema, UpdateStatusSchema, UpdateUserSchema, UserListQuerySchema } from '../types/user.schema';

export class UserController {
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UserListQuerySchema.safeParse(req.query);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    const result = await UserService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getRoles = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await UserService.getRoles();
    return sendSuccess(res, roles);
  });

  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.findById(req.params.id as string);
    return sendSuccess(res, user);
  });

  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateUserSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const user = await UserService.create(validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, user, 'User created successfully', 201);
  });

  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateUserSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const user = await UserService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, user, 'User updated successfully');
  });

  static updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdatePasswordSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const result = await UserService.updatePassword(req.params.id as string, validationResult.data.password, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, result, 'User password updated successfully');
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateStatusSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const user = await UserService.updateStatus(req.params.id as string, validationResult.data.status, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, user, 'User status updated successfully');
  });

  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    await UserService.softDelete(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'User deleted successfully');
  });
}
