import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { HeroService } from '../services/hero.service';
import { UpdateHeroSchema } from '../types/hero.schema';

export class HeroController {
  static getHero = asyncHandler(async (_req: Request, res: Response) => {
    const hero = await HeroService.findCurrent();
    return sendSuccess(res, hero);
  });

  static updateHero = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = UpdateHeroSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    if (!req.user?.userId) throw ApiError.unauthorized();

    const hero = await HeroService.update(req.params.id as string, validationResult.data, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, hero, 'Hero section updated successfully');
  });
}
