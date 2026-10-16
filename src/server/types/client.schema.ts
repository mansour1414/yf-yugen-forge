import { z } from 'zod';

export const CLIENT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'companyName',
  'contactName',
  'email',
  'country',
  'status',
] as const;

export const ClientListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  country: z.string().trim().min(1).optional(),
  sortBy: z.enum(CLIENT_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateClientSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  website: z.string().url('Website must be a valid URL').optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
});

export const UpdateClientSchema = z.object({
  companyName: z.string().min(2).optional(),
  contactName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  country: z.string().min(2).optional(),
  website: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be updated');

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
