import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { handleUniqueConstraintError, isUniqueConstraintError } from '../core/errors/prisma-error.util';
import { logActivity } from '../core/logger/activity.logger';
import { buildPrismaQuery, QueryOptions } from '../core/query/query.util';
import { getPaginationParams, createPaginationResult, PaginationOptions } from '../core/pagination/pagination.util';
import { CONTRACT_SORT_FIELDS, CreateContractInput, UpdateContractInput, SignContractInput } from '../types/contract.schema';
import { NotificationService } from './notification.service';

interface ContractQueryOptions extends PaginationOptions {
  search?: string;
  status?: string;
  clientId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// What a client is allowed to see of their own contract. This is an explicit allow-list (not
// `include`), because the contract row also carries `notes` — internal notes the admin form labels
// "not shown on the printed contract" — and `createdBy`, and the joined client row carries the
// studio's private `notes` about that client. The portal UI never displayed them, but the JSON
// response did.
const CLIENT_CONTRACT_SELECT = {
  id: true,
  contractNumber: true,
  title: true,
  scopeOfWork: true,
  deliverables: true,
  totalAmount: true,
  currency: true,
  paymentTerms: true,
  startDate: true,
  endDate: true,
  status: true,
  adminSignedName: true,
  adminSignedAt: true,
  clientSignedName: true,
  clientSignedAt: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { companyName: true, contactName: true, email: true } },
  project: { select: { id: true, title: true, titleAr: true } },
} as const;

// How many times create() re-allocates a contract number if two requests race for the same one.
const CONTRACT_NUMBER_MAX_ATTEMPTS = 3;

/**
 * Next contract number for the current year, e.g. YF-2026-0004.
 *
 * Based on the highest existing sequence rather than a row count: with `count + 1`, deleting a
 * draft in the middle of the range (say 0002 out of 0001..0003) made the next call return 0003
 * again and the insert failed on the unique constraint. Two requests can still race for the same
 * number, which is why create() retries on a unique violation.
 */
export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `YF-${year}-`;
  const existing = await prisma.contract.findMany({
    where: { contractNumber: { startsWith: prefix } },
    select: { contractNumber: true },
  });
  const maxSequence = existing.reduce((max: number, row: { contractNumber: string }) => {
    const sequence = Number.parseInt(row.contractNumber.slice(prefix.length), 10);
    return Number.isFinite(sequence) && sequence > max ? sequence : max;
  }, 0);
  return `${prefix}${String(maxSequence + 1).padStart(4, '0')}`;
}

export class ContractService {
  static async findAll(options: ContractQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    // Contract has no soft-delete (deletedAt) field, so excludeSoftDeleted must be
    // explicitly disabled here, otherwise buildPrismaQuery injects a `deletedAt`
    // filter Prisma doesn't recognize on this model (same class of bug fixed
    // earlier on Testimonial/Role).
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['title', 'contractNumber'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: CONTRACT_SORT_FIELDS,
      filters: { status: options.status, clientId: options.clientId },
      excludeSoftDeleted: false,
    } as QueryOptions);

    const [items, total] = await prisma.$transaction([
      prisma.contract.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: { select: { id: true, companyName: true, contactName: true, email: true } },
          project: { select: { id: true, title: true, titleAr: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return { data: items, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        project: { select: { id: true, title: true, titleAr: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
    if (!contract) throw ApiError.notFound('Contract not found');
    return contract;
  }

  /** Client Portal: list only this client's own contracts. */
  static async findMineForClient(clientId: string) {
    return prisma.contract.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: CLIENT_CONTRACT_SELECT,
    });
  }

  /** Client Portal: fetch a single contract, but only if it belongs to this client. */
  static async findByIdForClient(id: string, clientId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, clientId },
      select: CLIENT_CONTRACT_SELECT,
    });
    if (!contract) throw ApiError.notFound('Contract not found');
    return contract;
  }

  static async create(input: CreateContractInput, userId: string, ipAddress?: string) {
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) throw ApiError.badRequest('Selected client does not exist');

    if (input.projectId) {
      const project = await prisma.project.findUnique({ where: { id: input.projectId } });
      if (!project) throw ApiError.badRequest('Selected project does not exist');
    }

    let contract;
    for (let attempt = 1; ; attempt++) {
      const contractNumber = await generateContractNumber();
      try {
        contract = await prisma.contract.create({
          data: {
            contractNumber,
            clientId: input.clientId,
            projectId: input.projectId || null,
            title: input.title,
            scopeOfWork: input.scopeOfWork,
            deliverables: input.deliverables || null,
            totalAmount: input.totalAmount,
            currency: input.currency || 'USD',
            paymentTerms: input.paymentTerms || null,
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            notes: input.notes || null,
            createdBy: userId,
            status: 'DRAFT',
          },
          include: {
            client: { select: { id: true, companyName: true, contactName: true, email: true } },
            project: { select: { id: true, title: true, titleAr: true } },
          },
        });
        break;
      } catch (error) {
        // Only a unique violation on the contract number is retried; anything else is a real failure.
        if (!isUniqueConstraintError(error)) throw error;
        if (attempt >= CONTRACT_NUMBER_MAX_ATTEMPTS) {
          handleUniqueConstraintError(error, 'Could not allocate a unique contract number, please try again');
        }
      }
    }

    await logActivity({ action: 'CREATE', entity: 'CONTRACT', entityId: contract.id, userId, ipAddress });

    return contract;
  }

  static async update(id: string, input: UpdateContractInput, userId: string, ipAddress?: string) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Contract not found');

    if (existing.status === 'SIGNED' && input.status !== 'CANCELLED') {
      throw ApiError.badRequest('A signed contract cannot be edited. Cancel it and create a new one instead.');
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...(input.clientId !== undefined && { clientId: input.clientId }),
        ...(input.projectId !== undefined && { projectId: input.projectId || null }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.scopeOfWork !== undefined && { scopeOfWork: input.scopeOfWork }),
        ...(input.deliverables !== undefined && { deliverables: input.deliverables }),
        ...(input.totalAmount !== undefined && { totalAmount: input.totalAmount }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.paymentTerms !== undefined && { paymentTerms: input.paymentTerms }),
        ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
        ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: {
        client: { select: { id: true, companyName: true, contactName: true, email: true } },
        project: { select: { id: true, title: true, titleAr: true } },
      },
    });

    await logActivity({ action: 'UPDATE', entity: 'CONTRACT', entityId: contract.id, userId, ipAddress });

    return contract;
  }

  static async sign(id: string, input: SignContractInput, userId: string, ipAddress?: string) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Contract not found');
    if (existing.status === 'CANCELLED') throw ApiError.badRequest('A cancelled contract cannot be signed');

    // A fully executed contract is immutable, and each party signs exactly once. Without these
    // checks a second call silently overwrote the recorded signer name/date on a signed contract.
    if (existing.status === 'SIGNED') {
      throw ApiError.badRequest('This contract is already fully signed and cannot be modified');
    }
    if (input.role === 'admin' && existing.adminSignedAt) {
      throw ApiError.badRequest('This contract has already been signed by the studio');
    }
    if (input.role === 'client' && existing.clientSignedAt) {
      throw ApiError.badRequest('This contract has already been signed by the client');
    }

    const data: any = {};
    if (input.role === 'admin') {
      data.adminSignedName = input.signerName;
      data.adminSignedAt = new Date();
    } else {
      data.clientSignedName = input.signerName;
      data.clientSignedAt = new Date();
    }

    // Fully executed once both sides have signed
    const bothSigned =
      (input.role === 'admin' ? true : !!existing.adminSignedAt) &&
      (input.role === 'client' ? true : !!existing.clientSignedAt);
    if (bothSigned) data.status = 'SIGNED';
    else if (existing.status === 'DRAFT') data.status = 'SENT';

    const contract = await prisma.contract.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, userId: true, companyName: true, contactName: true, email: true } },
        project: { select: { id: true, title: true, titleAr: true } },
      },
    });

    await logActivity({ action: 'SIGN', entity: 'CONTRACT', entityId: contract.id, userId, ipAddress });

    // Let the client know when there's something for them to act on. Never
    // lets a notification failure break the actual sign operation.
    if (data.status === 'SENT' || data.status === 'SIGNED') {
      const isFullySigned = data.status === 'SIGNED';
      await NotificationService.create({
        userId: contract.client.userId,
        type: 'CONTRACT',
        title: isFullySigned ? 'تم توقيع العقد بالكامل' : 'عقد جديد بانتظار مراجعتك',
        body: isFullySigned
          ? `تم توقيع العقد رقم ${contract.contractNumber} من الطرفين.`
          : `يوجد عقد جديد (${contract.contractNumber}) بانتظار مراجعتك.`,
        link: '/account/contracts',
      }).catch(() => undefined);
    }

    return contract;
  }

  static async delete(id: string, userId: string, ipAddress?: string) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Contract not found');
    if (existing.status === 'SIGNED') {
      throw ApiError.badRequest('A signed contract cannot be deleted. Cancel it instead for audit purposes.');
    }

    await prisma.contract.delete({ where: { id } });
    await logActivity({ action: 'DELETE', entity: 'CONTRACT', entityId: id, userId, ipAddress });

    return { success: true };
  }
}
