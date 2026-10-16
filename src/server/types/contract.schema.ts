import { z } from 'zod';

export const CONTRACT_SORT_FIELDS = ['createdAt', 'updatedAt', 'totalAmount', 'status', 'title'] as const;

export const ContractListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED']).optional(),
  clientId: z.string().trim().min(1).optional(),
  sortBy: z.enum(CONTRACT_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateContractSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().min(1).optional().nullable(),
  title: z.string().min(3, 'Title is required'),
  scopeOfWork: z.string().min(10, 'Scope of work is required'),
  deliverables: z.string().optional().nullable(),
  totalAmount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().min(1).default('USD'),
  paymentTerms: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Zod 4 applies `.default()` even inside `.partial()`, so a bare partial() would reset `currency`
// to 'USD' on any update that omits it. Overridden here as a plain optional.
export const UpdateContractSchema = CreateContractSchema.partial().extend({
  currency: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED']).optional(),
});

export const SignContractSchema = z.object({
  signerName: z.string().min(2, 'Signer name is required'),
  role: z.enum(['admin', 'client']),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;
export type SignContractInput = z.infer<typeof SignContractSchema>;
export type ContractListQuery = z.infer<typeof ContractListQuerySchema>;
