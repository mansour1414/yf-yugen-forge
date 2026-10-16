import { z } from 'zod';

export const PRICING_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'displayOrder',
  'active',
  'featured',
] as const;

export const PricingListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  featured: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sortBy: z.enum(PRICING_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreatePricingPlanSchema = z.object({
  tierAr: z.string().trim().min(1, 'Arabic plan name is required'),
  tierEn: z.string().trim().min(1, 'English plan name is required'),
  price: z.string().trim().min(1, 'Price is required'),
  isCustom: z.boolean().default(false),
  descAr: z.string().trim().min(1, 'Arabic description is required'),
  descEn: z.string().trim().min(1, 'English description is required'),
  featuresAr: z.array(z.string().trim().min(1)).default([]),
  featuresEn: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  displayOrder: z.number().int().min(0).optional(),
});

// Zod 4 applies `.default()` even inside `.partial()` (which also made the "at least one field"
// check below always pass). Defaulted fields are overridden as plain optionals so omitted fields
// stay omitted instead of being reset to their create-time defaults (e.g. wiping the features
// lists or re-activating a hidden plan).
export const UpdatePricingPlanSchema = CreatePricingPlanSchema.partial().extend({
  isCustom: z.boolean().optional(),
  featuresAr: z.array(z.string().trim().min(1)).optional(),
  featuresEn: z.array(z.string().trim().min(1)).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export type CreatePricingPlanInput = z.infer<typeof CreatePricingPlanSchema>;
export type UpdatePricingPlanInput = z.infer<typeof UpdatePricingPlanSchema>;
