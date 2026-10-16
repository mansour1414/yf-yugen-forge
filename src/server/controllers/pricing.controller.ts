import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { PricingService } from '../services/pricing.service';
import { CreatePricingPlanSchema, PricingListQuerySchema, UpdatePricingPlanSchema } from '../types/pricing.schema';

export class PricingController {
  static getPlans = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = PricingListQuerySchema.safeParse(req.query);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    const result = await PricingService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getPlanById = asyncHandler(async (req: Request, res: Response) => {
    const plan = await PricingService.findById(req.params.id as string);
    return sendSuccess(res, plan);
  });

  static createPlan = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreatePricingPlanSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const plan = await PricingService.create(validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, plan, 'Pricing plan created successfully', 201);
  });

  static updatePlan = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdatePricingPlanSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const plan = await PricingService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, plan, 'Pricing plan updated successfully');
  });

  static deletePlan = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    await PricingService.softDelete(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'Pricing plan soft-deleted successfully');
  });
}
