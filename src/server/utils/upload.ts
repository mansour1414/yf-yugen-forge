import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { ApiError } from '../core/errors/api-error';

export type UploadCategory = 'images' | 'videos' | 'documents';

interface UploadDefinition {
  category: UploadCategory;
  extension: string;
  maxSize: number;
}

const MB = 1024 * 1024;

const UPLOAD_DEFINITIONS: Record<string, UploadDefinition> = {
  'image/jpeg': { category: 'images', extension: '.jpg', maxSize: 10 * MB },
  'image/png': { category: 'images', extension: '.png', maxSize: 10 * MB },
  'image/webp': { category: 'images', extension: '.webp', maxSize: 10 * MB },
  'video/mp4': { category: 'videos', extension: '.mp4', maxSize: 500 * MB },
  'video/webm': { category: 'videos', extension: '.webm', maxSize: 500 * MB },
  'video/quicktime': { category: 'videos', extension: '.mov', maxSize: 500 * MB },
  'application/pdf': { category: 'documents', extension: '.pdf', maxSize: 50 * MB },
};

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

export function getUploadDefinition(mimeType: string): UploadDefinition | undefined {
  return UPLOAD_DEFINITIONS[mimeType];
}

export function ensureUploadDirectories() {
  for (const category of ['images', 'videos', 'documents'] as UploadCategory[]) {
    fs.mkdirSync(path.join(UPLOAD_ROOT, category), { recursive: true });
  }
}

ensureUploadDirectories();

const storage = multer.diskStorage({
  destination: (_req, file, callback) => {
    const definition = getUploadDefinition(file.mimetype);
    if (!definition) {
      callback(ApiError.badRequest('Unsupported file type'), '');
      return;
    }

    callback(null, path.join(UPLOAD_ROOT, definition.category));
  },
  filename: (_req, file, callback) => {
    const definition = getUploadDefinition(file.mimetype);
    if (!definition) {
      callback(ApiError.badRequest('Unsupported file type'), '');
      return;
    }

    callback(null, `${randomUUID()}${definition.extension}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * MB,
    files: 10,
  },
  fileFilter: (_req, file, callback) => {
    if (!getUploadDefinition(file.mimetype)) {
      callback(ApiError.badRequest('Unsupported file type. Upload JPG, PNG, WebP, MP4, WebM, MOV, or PDF files.'));
      return;
    }

    callback(null, true);
  },
});

export function validateUploadSize(file: Express.Multer.File) {
  const definition = getUploadDefinition(file.mimetype);
  if (!definition) {
    throw ApiError.badRequest('Unsupported file type');
  }

  if (file.size > definition.maxSize) {
    const maxSizeInMb = definition.maxSize / MB;
    throw ApiError.badRequest(`${definition.category.slice(0, -1)} files must not exceed ${maxSizeInMb}MB`);
  }
}

export async function removeLocalUpload(filePath: string) {
  await fs.promises.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

export function getLocalUploadPath(url: string): string | null {
  const pathname = new URL(url, 'http://localhost').pathname;
  if (!pathname.startsWith('/uploads/')) return null;

  const filePath = path.resolve(UPLOAD_ROOT, pathname.slice('/uploads/'.length));
  if (!filePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) return null;

  return filePath;
}
