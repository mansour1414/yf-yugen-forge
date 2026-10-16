import { prisma } from '../../lib/prisma';
import { CLIENT_SORT_FIELDS, CreateClientInput, UpdateClientInput } from '../types/client.schema';
import { ApiError } from '../core/errors/api-error';
import { handleUniqueConstraintError } from '../core/errors/prisma-error.util';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { logActivity } from '../core/logger/activity.logger';
import { hashPassword, generateTemporaryPassword } from '../utils/password';
import { sendClientApprovalEmail } from './email.service';

interface ClientQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  country?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ClientService {
  static async findAll(options: ClientQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);

    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['companyName', 'contactName', 'email'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: CLIENT_SORT_FIELDS,
      filters: {
        status: options.status,
        country: options.country,
      },
    });

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, status: true, lastLogin: true } },
          _count: { select: { projects: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return {
      data: clients,
      pagination: createPaginationResult(total, page, limit),
    };
  }

  static async findById(id: string) {
    const client = await prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, status: true, lastLogin: true } },
        projects: true,
      },
    });

    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    return client;
  }

  static async create(input: CreateClientInput, userId: string, ipAddress?: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw ApiError.badRequest('Email already exists');
    }

    // Find Client role
    const clientRole = await prisma.role.findUnique({
      where: { name: 'Client' },
    });

    if (!clientRole) {
      throw ApiError.internal('Client role not seeded in database');
    }

    // Initial password is a cryptographically random 16-character string
    // (never predictable — contract numbers are sequential and were
    // previously reused here, which made temporary passwords guessable).
    // The client is forced to change it on first login via mustChangePassword.
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Run user and client creation inside transaction
    let client;
    try {
      client = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: input.contactName,
            email: input.email,
            password: hashedPassword,
            status: 'ACTIVE',
            mustChangePassword: true,
            roleId: clientRole.id,
          },
        });

        const newClient = await tx.client.create({
          data: {
            userId: newUser.id,
            companyName: input.companyName,
            contactName: input.contactName,
            email: input.email,
            phone: input.phone,
            country: input.country,
            website: input.website || null,
            notes: input.notes || null,
            status: input.status,
          },
          include: {
            user: { select: { id: true, email: true, status: true } },
          },
        });

        return newClient;
      });
    } catch (error) {
      handleUniqueConstraintError(error, 'Email already exists');
    }

    await logActivity({
      action: 'CREATE',
      entity: 'CLIENT',
      entityId: client.id,
      userId,
      ipAddress,
    });

    await sendClientApprovalEmail({
      toEmail: input.email,
      name: input.contactName,
      tempPassword: temporaryPassword,
      lang: 'ar',
    });

    return { client, temporaryPassword };
  }

  static async update(id: string, input: UpdateClientInput, userId: string, ipAddress?: string) {
    const existingClient = await this.findById(id);

    if (input.email && input.email !== existingClient.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (emailExists) {
        throw ApiError.badRequest('Email already exists');
      }
    }

    let client;
    try {
      client = await prisma.$transaction(async (tx) => {
        if (input.email) {
          await tx.user.update({
            where: { id: existingClient.userId },
            data: { email: input.email },
          });
        }

        const updated = await tx.client.update({
          where: { id },
          data: {
            ...input,
            ...(input.contactName && {
              user: { update: { name: input.contactName } },
            }),
          },
          include: {
            user: { select: { id: true, email: true, status: true } },
          },
        });

        return updated;
      });
    } catch (error) {
      handleUniqueConstraintError(error, 'Email already exists');
    }

    await logActivity({
      action: 'UPDATE',
      entity: 'CLIENT',
      entityId: client.id,
      userId,
      ipAddress,
    });

    return client;
  }

  static async softDelete(id: string, userId: string, ipAddress?: string) {
    const client = await this.findById(id);

    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.user.update({
        where: { id: client.userId },
        data: { status: 'DISABLED' },
      });
    });

    await logActivity({
      action: 'DELETE',
      entity: 'CLIENT',
      entityId: id,
      userId,
      ipAddress,
    });

    return { success: true };
  }
}
