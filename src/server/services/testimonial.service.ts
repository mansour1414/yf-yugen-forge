import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { CreateTestimonialInput, TESTIMONIAL_SORT_FIELDS, UpdateTestimonialInput } from '../types/testimonial.schema';

interface TestimonialQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  featured?: boolean;
  rating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TestimonialService {
  private static async assertDisplayOrderAvailable(displayOrder: number, id?: string) {
    const existing = await prisma.testimonial.findFirst({
      where: { displayOrder, ...(id && { NOT: { id } }) },
      select: { id: true },
    });

    if (existing) {
      throw ApiError.badRequest('Display order is already in use');
    }
  }

  static async findAll(options: TestimonialQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['name', 'company', 'content', 'position'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: TESTIMONIAL_SORT_FIELDS,
      filters: { featured: options.featured, rating: options.rating },
      excludeSoftDeleted: false,
    });

    const [total, testimonials] = await Promise.all([
      prisma.testimonial.count({ where }),
      prisma.testimonial.findMany({ where, skip, take: limit, orderBy }),
    ]);

    return { data: testimonials, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string) {
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw ApiError.notFound('Testimonial not found');
    return testimonial;
  }

  static async create(input: CreateTestimonialInput, userId: string, ipAddress?: string) {
    if (input.displayOrder !== undefined) {
      await this.assertDisplayOrderAvailable(input.displayOrder);
    }

    const testimonial = await prisma.testimonial.create({ data: input });
    await logActivity({ action: 'CREATE', entity: 'TESTIMONIAL', entityId: testimonial.id, userId, ipAddress });
    return testimonial;
  }

  static async update(id: string, input: UpdateTestimonialInput, userId: string, ipAddress?: string) {
    await this.findById(id);
    if (input.displayOrder !== undefined) {
      await this.assertDisplayOrderAvailable(input.displayOrder, id);
    }

    const testimonial = await prisma.testimonial.update({ where: { id }, data: input });
    await logActivity({ action: 'UPDATE', entity: 'TESTIMONIAL', entityId: testimonial.id, userId, ipAddress });
    return testimonial;
  }

  static async delete(id: string, userId: string, ipAddress?: string) {
    await this.findById(id);
    const testimonial = await prisma.testimonial.delete({ where: { id } });
    await logActivity({ action: 'DELETE', entity: 'TESTIMONIAL', entityId: testimonial.id, userId, ipAddress });
    return { success: true };
  }
}
