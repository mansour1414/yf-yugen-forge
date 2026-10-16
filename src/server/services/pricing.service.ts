import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { CreatePricingPlanInput, PRICING_SORT_FIELDS, UpdatePricingPlanInput } from '../types/pricing.schema';

interface PricingQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  active?: boolean;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PricingService {
  private static async assertDisplayOrderAvailable(displayOrder: number, id?: string) {
    const existing = await prisma.pricingPlan.findFirst({
      where: { displayOrder, deletedAt: null, ...(id && { NOT: { id } }) },
      select: { id: true },
    });

    if (existing) {
      throw ApiError.badRequest('Display order is already in use');
    }
  }

  static async findAll(options: PricingQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['tierAr', 'tierEn', 'descAr', 'descEn'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: PRICING_SORT_FIELDS,
      filters: { active: options.active, featured: options.featured },
    });

    const [total, plans] = await Promise.all([
      prisma.pricingPlan.count({ where }),
      prisma.pricingPlan.findMany({ where, skip, take: limit, orderBy }),
    ]);

    return { data: plans, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string) {
    const plan = await prisma.pricingPlan.findFirst({ where: { id, deletedAt: null } });
    if (!plan) throw ApiError.notFound('Pricing plan not found');
    return plan;
  }

  static async create(input: CreatePricingPlanInput, userId: string, ipAddress?: string) {
    if (input.displayOrder !== undefined) {
      await this.assertDisplayOrderAvailable(input.displayOrder);
    }

    const plan = await prisma.pricingPlan.create({ data: input });
    await logActivity({ action: 'CREATE', entity: 'PRICING_PLAN', entityId: plan.id, userId, ipAddress });
    return plan;
  }

  static async update(id: string, input: UpdatePricingPlanInput, userId: string, ipAddress?: string) {
    await this.findById(id);
    if (input.displayOrder !== undefined) {
      await this.assertDisplayOrderAvailable(input.displayOrder, id);
    }

    const plan = await prisma.pricingPlan.update({ where: { id }, data: input });
    await logActivity({ action: 'UPDATE', entity: 'PRICING_PLAN', entityId: plan.id, userId, ipAddress });
    return plan;
  }

  static async softDelete(id: string, userId: string, ipAddress?: string) {
    await this.findById(id);
    const plan = await prisma.pricingPlan.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    await logActivity({ action: 'DELETE', entity: 'PRICING_PLAN', entityId: plan.id, userId, ipAddress });
    return { success: true };
  }
}
