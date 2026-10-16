import { z } from 'zod';

export const PROJECT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'slug',
  'status',
  'category',
  'featured',
  'displayOrder',
  'startDate',
  'endDate',
] as const;

export const ProjectListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  category: z.string().trim().min(1).optional(),
  featured: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sortBy: z.enum(PROJECT_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  titleAr: z.string().optional(),
  titleEn: z.string().optional(),
  slug: z.string().min(2, 'Slug is required'),
  shortDescription: z.string().min(5, 'Short description is required'),
  shortDescriptionAr: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  description: z.string().min(10, 'Description is required'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
  category: z.string().min(1, 'Category is required'),
  categoryAr: z.string().optional(),
  categoryEn: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  typeAr: z.string().optional(),
  typeEn: z.string().optional(),
  coverImage: z.string().url('Cover image must be a valid URL'),
  thumbnail: z.string().url('Thumbnail must be a valid URL'),
  liveUrl: z.string().url('Live URL must be a valid URL').optional().nullable(),
  repositoryUrl: z.string().url('Repository URL must be a valid URL').optional().nullable(),
  githubUrl: z.string().url('GitHub URL must be a valid URL').optional().nullable(),
  figmaUrl: z.string().url('Figma URL must be a valid URL').optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  startDate: z.string().datetime().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  endDate: z.string().datetime().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  clientId: z.string().optional().nullable(),
  media: z.array(
    z.object({
      name: z.string().optional().nullable(),
      type: z.enum(['IMAGE', 'VIDEO', 'PDF', 'FIGMA']).default('IMAGE'),
      url: z.string().url('Media URL must be valid'),
      alt: z.string().optional().nullable(),
      displayOrder: z.number().int().default(0),
    })
  ).optional(),
});

// Zod 4 applies `.default()` even inside `.partial()`, so a bare CreateProjectSchema.partial()
// would silently reset status/featured/displayOrder on any update that omits them. The defaulted
// fields are overridden here as plain optionals so an omitted field stays omitted.
export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
