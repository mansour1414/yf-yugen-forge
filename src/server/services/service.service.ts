import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { CreateServiceInput, SERVICE_SORT_FIELDS, UpdateServiceInput } from '../types/service.schema';

interface ServiceQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  active?: boolean;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ServiceService {
  private static async assertDisplayOrderAvailable(displayOrder: number, id?: string) {
    const existing = await prisma.service.findFirst({
      where: { displayOrder, deletedAt: null, ...(id && { NOT: { id } }) },
      select: { id: true },
    });

    if (existing) {
      throw ApiError.badRequest('Display order is already in use');
    }
  }

  static async findAll(options: ServiceQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['title', 'description'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: SERVICE_SORT_FIELDS,
      filters: { active: options.active, featured: options.featured },
    });

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({ where, skip, take: limit, orderBy }),
    ]);

    return { data: services, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string) {
    const service = await prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw ApiError.notFound('Service not found');
    return service;
  }

  static async create(input: CreateServiceInput, userId: string, ipAddress?: string) {
    if (input.displayOrder !== undefined) {
      await this.assertDisplayOrderAvailable(input.displayOrder);
    }

    const service = await prisma.service.create({ data: input });
    await logActivity({ action: 'CREATE', entity: 'SERVICE', entityId: service.id, userId, ipAddress });
    return service;
  }

  static async update(id: string, input: UpdateServiceInput, userId: string, ipAddress?: string) {
    await this.findById(id);
    if (input.displayOrder !== undefined) {
      await this.assertDisplayOrderAvailable(input.displayOrder, id);
    }

    const service = await prisma.service.update({ where: { id }, data: input });
    await logActivity({ action: 'UPDATE', entity: 'SERVICE', entityId: service.id, userId, ipAddress });
    return service;
  }

  static async softDelete(id: string, userId: string, ipAddress?: string) {
    await this.findById(id);
    const service = await prisma.service.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    await logActivity({ action: 'DELETE', entity: 'SERVICE', entityId: service.id, userId, ipAddress });
    return { success: true };
  }
}
