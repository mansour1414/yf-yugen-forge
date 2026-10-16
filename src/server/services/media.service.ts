import { prisma } from '../../lib/prisma';
import { CreateMediaFolderInput, CreateMediaInput, UpdateMediaFolderInput, UpdateMediaInput } from '../types/media.schema';
import { ApiError } from '../core/errors/api-error';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { logActivity } from '../core/logger/activity.logger';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ffprobeStatic from 'ffprobe-static';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getLocalUploadPath, getUploadDefinition, removeLocalUpload, validateUploadSize } from '../utils/upload';
import { UploadedMediaMetadata } from '../types/upload.types';

function slugifyFolderName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `folder-${Date.now()}`;
}

const MEDIA_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'originalName',
  'mimeType',
  'size',
] as const;

const execFileAsync = promisify(execFile);

interface MediaQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  mimeType?: string;
  folderId?: string;
  uploadedBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MediaService {
  private static async getUploadedMediaMetadata(file: Express.Multer.File): Promise<UploadedMediaMetadata> {
    const definition = getUploadDefinition(file.mimetype);
    if (!definition) {
      throw ApiError.badRequest('Unsupported file type');
    }

    if (definition.category === 'images') {
      try {
        const metadata = await sharp(file.path).metadata();
        return {
          width: metadata.width || null,
          height: metadata.height || null,
          duration: null,
        };
      } catch {
        throw ApiError.badRequest('Invalid image file');
      }
    }

    if (definition.category === 'videos') {
      try {
        const { stdout } = await execFileAsync(ffprobeStatic.path, [
          '-v',
          'error',
          '-show_entries',
          'stream=width,height:format=duration',
          '-of',
          'json',
          file.path,
        ]);
        const metadata = JSON.parse(stdout) as {
          streams?: Array<{ width?: number; height?: number }>;
          format?: { duration?: string };
        };
        const duration = Number.parseFloat(metadata.format?.duration || '');
        const videoStream = metadata.streams?.find((stream) => stream.width || stream.height);

        if (!Number.isFinite(duration) || duration < 0) {
          throw new Error('Invalid duration');
        }

        return {
          width: videoStream?.width || null,
          height: videoStream?.height || null,
          duration: Math.round(duration),
        };
      } catch {
        throw ApiError.badRequest('Invalid video file');
      }
    }

    if (definition.category === 'documents') {
      const isValidPdf = await this.hasPdfSignature(file.path);
      if (!isValidPdf) {
        throw ApiError.badRequest('Invalid PDF file');
      }
      return { width: null, height: null, duration: null };
    }

    return { width: null, height: null, duration: null };
  }

  /**
   * Confirms the uploaded file actually starts with the PDF magic bytes
   * (%PDF-) instead of trusting the client-supplied `application/pdf` MIME
   * type alone — that header is fully attacker-controlled in the multipart
   * request and can be spoofed on any file. Reads only the first 5 bytes,
   * never the whole file.
   */
  private static async hasPdfSignature(filePath: string): Promise<boolean> {
    const PDF_SIGNATURE = Buffer.from('%PDF-', 'ascii');
    const handle = await fs.promises.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(PDF_SIGNATURE.length);
      const { bytesRead } = await handle.read(buffer, 0, PDF_SIGNATURE.length, 0);
      return bytesRead === PDF_SIGNATURE.length && buffer.equals(PDF_SIGNATURE);
    } catch {
      return false;
    } finally {
      await handle.close();
    }
  }

  private static async validateFolder(folderId?: string | null) {
    if (!folderId) return;

    const folder = await prisma.mediaFolder.findFirst({
      where: { id: folderId, deletedAt: null },
      select: { id: true },
    });

    if (!folder) {
      throw ApiError.badRequest('Media folder not found');
    }
  }

  // Walks up the ancestor chain of `candidateParentId` to make sure `folderId` does not
  // appear in it. Prevents indirect cycles (e.g. A -> B -> C -> A) that a simple
  // "parentId !== id" check on the immediate parent would miss.
  private static async assertNoCircularParent(folderId: string, candidateParentId: string) {
    let currentId: string | null = candidateParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === folderId) {
        throw ApiError.badRequest('Cannot move a folder into its own subfolder');
      }
      if (visited.has(currentId)) break; // defensive: avoid infinite loop on pre-existing bad data
      visited.add(currentId);

      const parent: { parentId: string | null } | null = await prisma.mediaFolder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId ?? null;
    }
  }

  static async findAll(options: MediaQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);

    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['name', 'originalName'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: MEDIA_SORT_FIELDS,
      excludeSoftDeleted: false,
      filters: {
        mimeType: options.mimeType,
        folderId: options.folderId,
        uploadedBy: options.uploadedBy,
      },
    });

    const [total, mediaItems] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        include: {
          folder: true,
          uploader: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return {
      data: mediaItems,
      pagination: createPaginationResult(total, page, limit),
    };
  }

  static async findById(id: string) {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        folder: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    if (!media) {
      throw ApiError.notFound('Media record not found');
    }

    return media;
  }

  static async create(input: CreateMediaInput, userId: string, ipAddress?: string) {
    const existing = await prisma.media.findUnique({
      where: { hash: input.hash },
    });

    if (existing) {
      throw ApiError.badRequest('Media asset with this hash already exists');
    }

    const media = await prisma.media.create({
      data: {
        ...input,
        uploadedBy: userId,
      },
      include: {
        folder: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      action: 'UPLOAD',
      entity: 'MEDIA',
      entityId: media.id,
      userId,
      ipAddress,
    });

    return media;
  }

  static async createUploadedMedia(
    file: Express.Multer.File,
    url: string,
    userId: string,
    folderId?: string | null,
    ipAddress?: string
  ) {
    validateUploadSize(file);
    await this.validateFolder(folderId);

    const metadata = await this.getUploadedMediaMetadata(file);
    const media = await prisma.media.create({
      data: {
        name: path.parse(file.originalname).name || path.parse(file.filename).name,
        originalName: file.originalname,
        extension: path.extname(file.filename).slice(1),
        hash: path.parse(file.filename).name,
        url,
        mimeType: file.mimetype,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        folderId: folderId || null,
        uploadedBy: userId,
      },
      include: {
        folder: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      action: 'UPLOAD',
      entity: 'MEDIA',
      entityId: media.id,
      userId,
      ipAddress,
    });

    return media;
  }

  static async update(id: string, input: UpdateMediaInput, userId: string, ipAddress?: string) {
    await this.findById(id);

    if (input.hash) {
      const existing = await prisma.media.findFirst({
        where: { hash: input.hash, NOT: { id } },
      });
      if (existing) {
        throw ApiError.badRequest('Media asset with this hash already exists');
      }
    }

    const media = await prisma.media.update({
      where: { id },
      data: input,
      include: {
        folder: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      action: 'UPDATE',
      entity: 'MEDIA',
      entityId: media.id,
      userId,
      ipAddress,
    });

    return media;
  }

  static async remove(id: string, userId: string, ipAddress?: string) {
    await this.findById(id);

    await prisma.media.delete({
      where: { id },
    });

    await logActivity({
      action: 'DELETE',
      entity: 'MEDIA',
      entityId: id,
      userId,
      ipAddress,
    });

    return { success: true };
  }

  static async removeFile(id: string, userId: string, ipAddress?: string) {
    const media = await this.findById(id);
    const filePath = getLocalUploadPath(media.url);

    if (filePath) {
      await removeLocalUpload(filePath);
    }

    await prisma.media.delete({
      where: { id },
    });

    await logActivity({
      action: 'DELETE',
      entity: 'MEDIA',
      entityId: id,
      userId,
      ipAddress,
    });

    return { success: true };
  }

  static async findFolders() {
    return prisma.mediaFolder.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  static async createFolder(input: CreateMediaFolderInput, userId: string, ipAddress?: string) {
    if (input.parentId) {
      await this.validateFolder(input.parentId);
    }

    const slug = input.slug?.trim() || slugifyFolderName(input.name);

    const folder = await prisma.mediaFolder.create({
      data: {
        name: input.name,
        slug,
        parentId: input.parentId || null,
      },
    });

    await logActivity({ action: 'CREATE', entity: 'MEDIA_FOLDER', entityId: folder.id, userId, ipAddress });
    return folder;
  }

  static async updateFolder(id: string, input: UpdateMediaFolderInput, userId: string, ipAddress?: string) {
    const existing = await prisma.mediaFolder.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw ApiError.notFound('Media folder not found');
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw ApiError.badRequest('A folder cannot be its own parent');
      }
      await this.validateFolder(input.parentId);
      await this.assertNoCircularParent(id, input.parentId);
    }

    const folder = await prisma.mediaFolder.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.parentId !== undefined && { parentId: input.parentId || null }),
      },
    });

    await logActivity({ action: 'UPDATE', entity: 'MEDIA_FOLDER', entityId: folder.id, userId, ipAddress });
    return folder;
  }

  static async deleteFolder(id: string, userId: string, ipAddress?: string) {
    const existing = await prisma.mediaFolder.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw ApiError.notFound('Media folder not found');
    }

    const [childFolderCount, mediaCount] = await Promise.all([
      prisma.mediaFolder.count({ where: { parentId: id, deletedAt: null } }),
      prisma.media.count({ where: { folderId: id } }),
    ]);

    if (childFolderCount > 0 || mediaCount > 0) {
      throw ApiError.badRequest('Cannot delete a folder that still contains subfolders or media');
    }

    await prisma.mediaFolder.update({ where: { id }, data: { deletedAt: new Date() } });
    await logActivity({ action: 'DELETE', entity: 'MEDIA_FOLDER', entityId: id, userId, ipAddress });
    return { success: true };
  }
}
