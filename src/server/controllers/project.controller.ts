import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { CreateProjectSchema, ProjectListQuerySchema, UpdateProjectSchema } from '../types/project.schema';
import { asyncHandler } from '../core/validators/async-handler';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { ApiError } from '../core/errors/api-error';

export class ProjectController {
  static getProjects = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = ProjectListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    const result = await ProjectService.findAll(validationResult.data);

    return sendPaginated(res, result.data, result.pagination);
  });

  static getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const project = await ProjectService.findById(id);
    return sendSuccess(res, project);
  });

  static createProject = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const project = await ProjectService.create(validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, project, 'Project created successfully', 201);
  });

  static updateProject = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validationResult = UpdateProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const project = await ProjectService.update(id, validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, project, 'Project updated successfully');
  });

  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    await ProjectService.softDelete(id, req.user.userId, ipAddress);

    return sendSuccess(res, null, 'Project soft-deleted successfully');
  });
}
