import { z } from 'zod';

export const USER_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'email',
  'status',
] as const;

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  roleId: z.string().trim().min(1).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  sortBy: z.enum(USER_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().trim().min(1, 'Role ID is required'),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  avatar: z.string().url('Avatar URL must be valid').optional().nullable(),
});

// Zod 4 applies `.default()` even inside `.partial()`. With a bare partial(), any update that
// omitted `status` (e.g. renaming a user) would parse as status 'ACTIVE' and silently re-enable a
// disabled account. Overridden here as a plain optional; this also makes the "at least one field"
// check meaningful again.
export const UpdateUserSchema = CreateUserSchema.omit({ password: true }).partial().extend({
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
