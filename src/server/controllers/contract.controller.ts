import { Request, Response } from 'express';
import { ContractService } from '../services/contract.service';
import { ContractListQuerySchema, CreateContractSchema, UpdateContractSchema, SignContractSchema } from '../types/contract.schema';
import { asyncHandler } from '../core/validators/async-handler';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { ApiError } from '../core/errors/api-error';

export class ContractController {
  static getContracts = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = ContractListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    const result = await ContractService.findAll(validationResult.data);
    return sendPaginated(res, result.data, result.pagination);
  });

  static getContractById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const contract = await ContractService.findById(id);
    return sendSuccess(res, contract);
  });

  static createContract = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateContractSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const contract = await ContractService.create(validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, contract, 'Contract created successfully', 201);
  });

  static updateContract = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validationResult = UpdateContractSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const contract = await ContractService.update(id, validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, contract, 'Contract updated successfully');
  });

  static signContract = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validationResult = SignContractSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }
    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const contract = await ContractService.sign(id, validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, contract, 'Contract signed successfully');
  });

  static deleteContract = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    await ContractService.delete(id, req.user.userId, ipAddress);

    return sendSuccess(res, null, 'Contract deleted successfully');
  });
}
