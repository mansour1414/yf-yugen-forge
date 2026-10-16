import { Request, Response } from 'express';
import { sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { PublicService } from '../services/public.service';

export class PublicController {
  static getSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await PublicService.getSettings();
    return sendSuccess(res, settings);
  });

  static getHero = asyncHandler(async (req: Request, res: Response) => {
    const hero = await PublicService.getHero(req);
    return sendSuccess(res, hero);
  });

  static getServices = asyncHandler(async (req: Request, res: Response) => {
    const services = await PublicService.getServices(req);
    return sendSuccess(res, services);
  });

  static getPricingPlans = asyncHandler(async (req: Request, res: Response) => {
    const plans = await PublicService.getPricingPlans(req);
    return sendSuccess(res, plans);
  });

  static getProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await PublicService.getProjects(req);
    return sendSuccess(res, projects);
  });

  static getTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const testimonials = await PublicService.getTestimonials(req);
    return sendSuccess(res, testimonials);
  });

  static getHome = asyncHandler(async (req: Request, res: Response) => {
    const homeData = await PublicService.getHome(req);
    return sendSuccess(res, homeData);
  });
}
