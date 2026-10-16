import { z } from 'zod';
import { isSafeLink } from '../utils/safe-url.util';

export const UpdateHeroSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  titleAr: z.string().trim().optional(),
  titleEn: z.string().trim().optional(),
  subtitle: z.string().trim().min(1, 'Subtitle is required'),
  subtitleAr: z.string().trim().optional(),
  subtitleEn: z.string().trim().optional(),
  buttonText: z.string().trim().min(1, 'Button text is required'),
  buttonTextAr: z.string().trim().optional(),
  buttonTextEn: z.string().trim().optional(),
  // Rendered as <a href> on the public homepage, so `javascript:` (and similar) must be refused.
  buttonLink: z.string().trim().min(1, 'Button link is required').refine(
    isSafeLink,
    'Button link must be an anchor (#contact), a path (/page) or an http(s):// URL'
  ),
  videoUrl: z.string().url('Video URL must be valid').optional().nullable(),
  background: z.string().url('Background URL must be valid').optional().nullable(),
  active: z.boolean(),
}).partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

export type UpdateHeroInput = z.infer<typeof UpdateHeroSchema>;
