import { z } from 'zod';

export const SERVICE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'displayOrder',
  'active',
  'featured',
] as const;

export const ServiceListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  featured: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sortBy: z.enum(SERVICE_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateServiceSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  titleAr: z.string().trim().optional(),
  titleEn: z.string().trim().optional(),
  description: z.string().trim().min(5, 'Description is required'),
  descriptionAr: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  icon: z.string().trim().min(1, 'Icon is required'),
  color: z.string().trim().min(1, 'Color is required'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  displayOrder: z.number().int().min(0).optional(),
});

// Zod 4 applies `.default()` even inside `.partial()` (which also made the "at least one field"
// check below always pass). Defaulted fields are overridden as plain optionals so omitted fields
// stay omitted instead of being reset to their create-time defaults.
export const UpdateServiceSchema = CreateServiceSchema.partial().extend({
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
