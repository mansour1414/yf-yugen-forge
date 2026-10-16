import { Request, Response } from 'express';
import { MediaService } from '../services/media.service';
import { CreateMediaFolderSchema, CreateMediaSchema, UpdateMediaFolderSchema, UpdateMediaSchema } from '../types/media.schema';
import { asyncHandler } from '../core/validators/async-handler';
import { sendPaginated, sendSuccess } from '../core/responses/response.util';
import { ApiError } from '../core/errors/api-error';
import { env } from '../core/config/env.config';
import { getUploadDefinition, removeLocalUpload } from '../utils/upload';

export class MediaController {
  private static getPublicUrl(req: Request, file: Express.Multer.File) {
    const definition = getUploadDefinition(file.mimetype);
    if (!definition) {
      throw ApiError.badRequest('Unsupported file type');
    }

    const baseUrl = env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/${definition.category}/${file.filename}`;
  }

  private static getFolderId(req: Request) {
    return typeof req.body?.folderId === 'string' && req.body.folderId.trim()
      ? req.body.folderId.trim()
      : undefined;
  }

  static getMedia = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, mimeType, folderId, uploadedBy, sortBy, sortOrder } = req.query;

    const result = await MediaService.findAll({
      page: page as string,
      limit: limit as string,
      search: typeof search === 'string' ? search : undefined,
      mimeType: typeof mimeType === 'string' ? mimeType : undefined,
      folderId: typeof folderId === 'string' ? folderId : undefined,
      uploadedBy: typeof uploadedBy === 'string' ? uploadedBy : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
    });

    return sendPaginated(res, result.data, result.pagination);
  });

  static getMediaById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const media = await MediaService.findById(id);
    return sendSuccess(res, media);
  });

  static getFolders = asyncHandler(async (_req: Request, res: Response) => {
    const folders = await MediaService.findFolders();
    return sendSuccess(res, folders);
  });

  static createFolder = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateMediaFolderSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const folder = await MediaService.createFolder(validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, folder, 'Media folder created successfully', 201);
  });

  static updateFolder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validationResult = UpdateMediaFolderSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const folder = await MediaService.updateFolder(id, validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, folder, 'Media folder updated successfully');
  });

  static deleteFolder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    await MediaService.deleteFolder(id, req.user.userId, ipAddress);

    return sendSuccess(res, null, 'Media folder deleted successfully');
  });

  static uploadMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest('A file is required');
    }
    if (!req.user?.userId) {
      throw ApiError.unauthorized();
    }

    try {
      const media = await MediaService.createUploadedMedia(
        req.file,
        MediaController.getPublicUrl(req, req.file),
        req.user.userId,
        MediaController.getFolderId(req),
        req.ip || req.socket.remoteAddress
      );

      return sendSuccess(res, media, 'File uploaded successfully', 201);
    } catch (error) {
      await removeLocalUpload(req.file.path).catch(() => undefined);
      throw error;
    }
  });

  static uploadMultipleMedia = asyncHandler(async (req: Request, res: Response) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      throw ApiError.badRequest('At least one file is required');
    }
    if (!req.user?.userId) {
      throw ApiError.unauthorized();
    }

    const uploadedMedia: Array<{ id: string }> = [];
    try {
      const media = [];
      for (const file of files) {
        const item = await MediaService.createUploadedMedia(
          file,
          MediaController.getPublicUrl(req, file),
          req.user.userId,
          MediaController.getFolderId(req),
          req.ip || req.socket.remoteAddress
        );
        uploadedMedia.push(item);
        media.push(item);
      }

      return sendSuccess(res, media, 'Files uploaded successfully', 201);
    } catch (error) {
      await Promise.all(
        uploadedMedia.map((media) =>
          MediaService.removeFile(media.id, req.user!.userId, req.ip || req.socket.remoteAddress).catch(() => undefined)
        )
      );
      await Promise.all(files.map((file) => removeLocalUpload(file.path).catch(() => undefined)));
      throw error;
    }
  });

  static createMedia = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = CreateMediaSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const media = await MediaService.create(validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, media, 'Media record created successfully', 201);
  });

  static updateMedia = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validationResult = UpdateMediaSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ApiError.badRequest('Validation failed', validationResult.error.format());
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const media = await MediaService.update(id, validationResult.data, req.user.userId, ipAddress);

    return sendSuccess(res, media, 'Media record updated successfully');
  });

  static deleteMedia = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized();
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    await MediaService.remove(id, req.user.userId, ipAddress);

    return sendSuccess(res, null, 'Media record deleted successfully');
  });

  static deleteMediaFile = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!req.user?.userId) {
      throw ApiError.unauthorized();
    }

    await MediaService.removeFile(id, req.user.userId, req.ip || req.socket.remoteAddress);
    return sendSuccess(res, null, 'Media file deleted successfully');
  });
}
