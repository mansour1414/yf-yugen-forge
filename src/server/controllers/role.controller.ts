import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { RoleService } from '../services/role.service';
import { CreateRoleSchema, RoleListQuerySchema, UpdateRolePermissionsSchema, UpdateRoleSchema } from '../types/role.schema';

export class RoleController {
  static getRoles = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = RoleListQuerySchema.safeParse(req.query);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    const result = await RoleService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getPermissions = asyncHandler(async (_req: Request, res: Response) => {
    const permissions = await RoleService.findAllPermissions();
    return sendSuccess(res, permissions);
  });

  static getRoleById = asyncHandler(async (req: Request, res: Response) => {
    const role = await RoleService.findById(req.params.id as string);
    return sendSuccess(res, role);
  });

  static createRole = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateRoleSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const role = await RoleService.create(validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, role, 'Role created successfully', 201);
  });

  static updateRole = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateRoleSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const role = await RoleService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, role, 'Role updated successfully');
  });

  static updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateRolePermissionsSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const role = await RoleService.updatePermissions(req.params.id as string, validationResult.data.permissionIds, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, role, 'Role permissions updated successfully');
  });

  static deleteRole = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    await RoleService.delete(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'Role deleted successfully');
  });
}
