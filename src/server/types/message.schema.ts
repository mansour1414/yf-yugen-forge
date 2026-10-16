import { z } from 'zod';

export const MESSAGE_SORT_FIELDS = [
  'createdAt',
  'status',
  'isRead',
  'name',
  'email',
  'company',
  'subject',
  'budget',
] as const;

export const MessageListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'ARCHIVED']).optional(),
  serviceId: z.string().min(1).optional(),
  isRead: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sortBy: z.enum(MESSAGE_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// This schema backs the PUBLIC contact form (no authentication), so every free-text field has an
// upper bound: without one a single request could store — and then email to the studio — up to the
// JSON body limit in any field.
export const CreateMessageSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  email: z.string().trim().email('Invalid email address').max(254, 'Email is too long'),
  phone: z.string().trim().max(40, 'Phone is too long').optional().nullable(),
  company: z.string().trim().max(200, 'Company is too long').optional().nullable(),
  subject: z.string().trim().max(200, 'Subject is too long').optional().nullable(),
  message: z.string().trim().min(1, 'Message is required').max(5000, 'Message is too long (max 5000 characters)'),
  serviceId: z.string().min(1).optional().nullable(),
  budget: z.string().trim().max(50, 'Budget is too long').optional().nullable(),
  source: z.string().trim().max(100, 'Source is too long').optional().nullable(),
  contactMethod: z.enum(['email', 'whatsapp']).optional(),
  lang: z.enum(['ar', 'en']).optional(),
});

export const UpdateMessageSchema = z.object({
  status: z.enum(['NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'ARCHIVED']).optional(),
  serviceId: z.string().min(1).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be updated');

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
