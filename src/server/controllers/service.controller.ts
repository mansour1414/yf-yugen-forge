import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { ServiceService } from '../services/service.service';
import { CreateServiceSchema, ServiceListQuerySchema, UpdateServiceSchema } from '../types/service.schema';

export class ServiceController {
  static getServices = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = ServiceListQuerySchema.safeParse(req.query);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    const result = await ServiceService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.findById(req.params.id as string);
    return sendSuccess(res, service);
  });

  static createService = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateServiceSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const service = await ServiceService.create(validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, service, 'Service created successfully', 201);
  });

  static updateService = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateServiceSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const service = await ServiceService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, service, 'Service updated successfully');
  });

  static deleteService = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    await ServiceService.softDelete(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'Service soft-deleted successfully');
  });
}
