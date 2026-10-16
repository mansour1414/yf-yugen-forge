import { prisma } from '../../lib/prisma';
import { CreateProjectInput, PROJECT_SORT_FIELDS, UpdateProjectInput } from '../types/project.schema';
import { ApiError } from '../core/errors/api-error';
import { handleUniqueConstraintError } from '../core/errors/prisma-error.util';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { logActivity } from '../core/logger/activity.logger';

interface ProjectQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  category?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProjectService {
  private static async ensureClientExists(clientId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw ApiError.badRequest('Client not found');
    }
  }

  static async findAll(options: ProjectQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);

    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['title', 'shortDescription'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: PROJECT_SORT_FIELDS,
      filters: {
        status: options.status,
        category: options.category,
        featured: options.featured,
      },
    });

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          client: true,
          creator: { select: { id: true, name: true, email: true } },
          media: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return {
      data: projects,
      pagination: createPaginationResult(total, page, limit),
    };
  }

  static async findById(id: string) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        creator: { select: { id: true, name: true, email: true } },
        media: true,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    return project;
  }

  static async create(input: CreateProjectInput, userId: string, ipAddress?: string) {
    const existing = await prisma.project.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw ApiError.badRequest('Project slug must be unique');
    }

    if (input.clientId) {
      await this.ensureClientExists(input.clientId);
    }

    const { media, startDate, endDate, ...projectData } = input;

    let project;
    try {
      project = await prisma.project.create({
        data: {
          ...projectData,
          startDate: startDate || null,
          endDate: endDate || null,
          createdBy: userId,
          media: media
            ? {
                create: media.map((m) => ({
                  name: m.name || null,
                  type: m.type,
                  url: m.url,
                  alt: m.alt || null,
                  displayOrder: m.displayOrder,
                })),
              }
            : undefined,
        },
        include: {
          media: true,
          client: true,
        },
      });
    } catch (error) {
      handleUniqueConstraintError(error, 'Project slug must be unique');
    }

    await logActivity({
      action: 'CREATE',
      entity: 'PROJECT',
      entityId: project.id,
      userId,
      ipAddress,
    });

    return project;
  }

  static async update(id: string, input: UpdateProjectInput, userId: string, ipAddress?: string) {
    await this.findById(id);

    if (input.slug) {
      const existing = await prisma.project.findFirst({
        where: { slug: input.slug, NOT: { id } },
      });
      if (existing) {
        throw ApiError.badRequest('Project slug must be unique');
      }
    }

    if (input.clientId) {
      await this.ensureClientExists(input.clientId);
    }

    const { media, startDate, endDate, ...projectData } = input;

    let project;
    try {
      project = await prisma.project.update({
        where: { id },
        data: {
          ...projectData,
          ...(startDate !== undefined && { startDate: startDate || null }),
          ...(endDate !== undefined && { endDate: endDate || null }),
          ...(media !== undefined && {
            media: {
              deleteMany: {},
              create: media.map((m) => ({
                name: m.name || null,
                type: m.type,
                url: m.url,
                alt: m.alt || null,
                displayOrder: m.displayOrder,
              })),
            },
          }),
        },
        include: {
          media: true,
          client: true,
        },
      });
    } catch (error) {
      handleUniqueConstraintError(error, 'Project slug must be unique');
    }

    await logActivity({
      action: 'UPDATE',
      entity: 'PROJECT',
      entityId: project.id,
      userId,
      ipAddress,
    });

    return project;
  }

  static async softDelete(id: string, userId: string, ipAddress?: string) {
    await this.findById(id);

    const project = await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      action: 'DELETE',
      entity: 'PROJECT',
      entityId: project.id,
      userId,
      ipAddress,
    });

    return { success: true };
  }
}
