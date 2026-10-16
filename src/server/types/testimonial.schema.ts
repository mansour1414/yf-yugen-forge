import { z } from 'zod';

export const TESTIMONIAL_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'company',
  'rating',
  'displayOrder',
  'featured',
] as const;

export const TestimonialListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  featured: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(TESTIMONIAL_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateTestimonialSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  company: z.string().trim().min(1, 'Company is required'),
  position: z.string().trim().optional().nullable(),
  positionAr: z.string().trim().optional().nullable(),
  positionEn: z.string().trim().optional().nullable(),
  avatar: z.string().url('Avatar URL must be valid').optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  content: z.string().trim().min(5, 'Content is required'),
  contentAr: z.string().trim().optional(),
  contentEn: z.string().trim().optional(),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

// Zod 4 applies `.default()` even inside `.partial()` (which also made the "at least one field"
// check below always pass). Defaulted fields are overridden as plain optionals so omitted fields
// stay omitted instead of being reset to their create-time defaults.
export const UpdateTestimonialSchema = CreateTestimonialSchema.partial().extend({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  featured: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export type CreateTestimonialInput = z.infer<typeof CreateTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof UpdateTestimonialSchema>;
