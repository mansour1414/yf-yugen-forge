import { Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { asyncHandler } from '../core/validators/async-handler';
import { ContractService } from '../services/contract.service';
import { MessageService } from '../services/message.service';
import { z } from 'zod';

const CreateClientMessageSchema = z.object({
  subject: z.string().trim().optional(),
  message: z.string().trim().min(1, 'Message is required'),
});

export class ClientPortalController {
  static getMyContracts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.clientId) throw ApiError.forbidden();
    const contracts = await ContractService.findMineForClient(req.clientId);
    return sendSuccess(res, contracts);
  });

  static getMyContractById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.clientId) throw ApiError.forbidden();
    const contract = await ContractService.findByIdForClient(req.params.id as string, req.clientId);
    return sendSuccess(res, contract);
  });

  static getMyMessages = asyncHandler(async (req: Request, res: Response) => {
    if (!req.clientId) throw ApiError.forbidden();
    const { page, limit } = req.query;
    const result = await MessageService.findMineForClient(req.clientId, { page: page as string, limit: limit as string });
    return sendPaginated(res, result.data, result.pagination);
  });

  static createMyMessage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.clientId) throw ApiError.forbidden();
    const validationResult = CreateClientMessageSchema.safeParse(req.body);
    if (!validationResult.success) throw ApiError.badRequest('Validation failed', validationResult.error.format());
    const message = await MessageService.createFromClient(req.clientId, validationResult.data);
    return sendSuccess(res, message, 'Message sent successfully', 201);
  });
}
