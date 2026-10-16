import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { TestimonialService } from '../services/testimonial.service';
import { CreateTestimonialSchema, TestimonialListQuerySchema, UpdateTestimonialSchema } from '../types/testimonial.schema';

export class TestimonialController {
  static getTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = TestimonialListQuerySchema.safeParse(req.query);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    const result = await TestimonialService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getTestimonialById = asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await TestimonialService.findById(req.params.id as string);
    return sendSuccess(res, testimonial);
  });

  static createTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateTestimonialSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const testimonial = await TestimonialService.create(validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, testimonial, 'Testimonial created successfully', 201);
  });

  static updateTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateTestimonialSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();
    const testimonial = await TestimonialService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, testimonial, 'Testimonial updated successfully');
  });

  static deleteTestimonial = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw ApiError.unauthorized();
    await TestimonialService.delete(req.params.id as string, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'Testimonial deleted successfully');
  });
}
