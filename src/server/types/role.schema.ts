import { z } from 'zod';

export const ROLE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
] as const;

export const RoleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(ROLE_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name is required'),
  description: z.string().trim().optional().nullable(),
  permissionIds: z.array(z.string()).optional(),
});

export const UpdateRoleSchema = CreateRoleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export const UpdateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>;
