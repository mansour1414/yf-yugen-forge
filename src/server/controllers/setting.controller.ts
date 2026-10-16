import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { SettingService } from '../services/setting.service';
import { BulkUpdateSettingsSchema, GroupUpdateSettingsSchema } from '../types/setting.schema';

export class SettingController {
  static getSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await SettingService.findAll();
    return sendSuccess(res, settings);
  });

  static getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await SettingService.findPublic();
    return sendSuccess(res, settings);
  });

  static getSettingsByGroup = asyncHandler(async (req: Request, res: Response) => {
    const group = req.params.group as string;
    const settings = await SettingService.findByGroup(group);
    return sendSuccess(res, settings);
  });

  static bulkUpdateSettings = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = BulkUpdateSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    if (!req.user?.userId) throw ApiError.unauthorized();

    const settings = await SettingService.bulkUpdate(
      validationResult.data,
      req.user.userId,
      req.ip || req.socket.remoteAddress
    );
    return sendSuccess(res, settings, 'Settings updated successfully');
  });

  static updateGroupSettings = asyncHandler(async (req: Request, res: Response) => {
    const group = req.params.group as string;
    const validationResult = GroupUpdateSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    if (!req.user?.userId) throw ApiError.unauthorized();

    const settings = await SettingService.updateGroup(
      group,
      validationResult.data,
      req.user.userId,
      req.ip || req.socket.remoteAddress
    );
    return sendSuccess(res, settings, `Settings group ${group} updated successfully`);
  });
}
