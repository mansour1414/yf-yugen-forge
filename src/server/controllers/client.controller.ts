import { Request, Response } from 'express';
import { ClientService } from '../services/client.service';
import { ClientListQuerySchema, CreateClientSchema, UpdateClientSchema } from '../types/client.schema';
import { asyncHandler } from '../core/validators/async-handler';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { ApiError } from '../core/errors/api-error';

export class ClientController {
  static getClients = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = ClientListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    const result = await ClientService.findAll(validationResult.data);

    return sendPaginated(res, result.data, result.pagination);
  });

  static getClientById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = await ClientService.findById(id);
    return sendSuccess(res, client);
  });

  static createClient = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateClientSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const client = await ClientService.create(validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, client, 'Client created successfully', 201);
  });

  static updateClient = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validationResult = UpdateClientSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const client = await ClientService.update(id, validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, client, 'Client updated successfully');
  });

  static deleteClient = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    await ClientService.softDelete(id, req.user.userId, ipAddress);

    return sendSuccess(res, null, 'Client soft-deleted successfully');
  });
}
