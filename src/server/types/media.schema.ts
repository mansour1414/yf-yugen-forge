import { z } from 'zod';

export const CreateMediaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  originalName: z.string().min(1, 'Original name is required'),
  extension: z.string().min(1, 'Extension is required'),
  hash: z.string().min(1, 'Hash is required'),
  url: z.string().url('URL must be valid'),
  mimeType: z.string().min(1, 'MimeType is required'),
  size: z.number().int().positive('Size must be a positive integer'),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
  duration: z.number().int().optional().nullable(),
  alt: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
  folderId: z.string().optional().nullable(),
});

// Zod 4 applies `.default()` even inside `.partial()`, so a bare partial() would flip `isPublic`
// back to true on any update that omits it. Overridden here as a plain optional.
export const UpdateMediaSchema = CreateMediaSchema.partial().extend({
  isPublic: z.boolean().optional(),
});

export type CreateMediaInput = z.infer<typeof CreateMediaSchema>;
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;

export const CreateMediaFolderSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z.string().trim().min(1, 'Slug must not be empty').optional(),
  parentId: z.string().min(1).optional().nullable(),
});

export const UpdateMediaFolderSchema = CreateMediaFolderSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export type CreateMediaFolderInput = z.infer<typeof CreateMediaFolderSchema>;
export type UpdateMediaFolderInput = z.infer<typeof UpdateMediaFolderSchema>;
