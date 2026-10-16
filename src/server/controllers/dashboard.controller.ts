import { Request, Response } from 'express';
import { sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static getDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await DashboardService.getDashboardStats();
    return sendSuccess(res, stats);
  });
}
