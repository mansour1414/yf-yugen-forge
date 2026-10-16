import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { handleUniqueConstraintError } from '../core/errors/prisma-error.util';
import { logActivity } from '../core/logger/activity.logger';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { hashPassword } from '../utils/password';
import { validatePassword } from '../utils/password-policy';
import { CreateUserInput, UpdateUserInput, USER_SORT_FIELDS } from '../types/user.schema';
import { sendEmployeeInvitationEmail } from './email.service';

interface UserQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  roleId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class UserService {
  /**
   * `users.update` / `users.create` / `users.delete` are ordinary permissions, so on their own they
   * would let anyone holding them promote themselves or a friend to Admin, reset an Admin's
   * password (= account takeover) or disable an Admin. When an Admin role is involved — as the
   * account being managed or as the role being assigned — the acting user must be an Admin too.
   */
  private static async assertActorCanManage(currentUserId: string, roleNames: Array<string | null | undefined>) {
    if (!roleNames.includes('Admin')) return;

    const actor = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: { select: { name: true } } },
    });

    if (actor?.role?.name !== 'Admin') {
      throw ApiError.forbidden('Only an Admin can manage Admin accounts or assign the Admin role');
    }
  }

  static async findAll(options: UserQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['name', 'email'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: USER_SORT_FIELDS,
      filters: { roleId: options.roleId, status: options.status },
    });

    const activeWhere = { ...where, deletedAt: null };

    const [total, users] = await Promise.all([
      prisma.user.count({ where: activeWhere }),
      prisma.user.findMany({
        where: activeWhere,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { data: users, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        roleId: true,
        role: { select: { id: true, name: true } },
      },
    });

    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async getRoles() {
    return await prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  static async create(input: CreateUserInput, currentUserId: string, ipAddress?: string) {
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.success) {
      throw ApiError.badRequest('Password policy violation', passwordValidation.errors);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw ApiError.badRequest('Email already exists');
    }

    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) {
      throw ApiError.badRequest('Specified role does not exist');
    }

    await this.assertActorCanManage(currentUserId, [role.name]);

    const hashedPassword = await hashPassword(input.password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          roleId: input.roleId,
          status: input.status || 'ACTIVE',
          mustChangePassword: true,
          avatar: input.avatar,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      handleUniqueConstraintError(error, 'Email already exists');
    }

    await logActivity({ action: 'CREATE', entity: 'USER', entityId: user.id, userId: currentUserId, ipAddress });

    await sendEmployeeInvitationEmail({
      toEmail: input.email,
      name: input.name,
      tempPassword: input.password,
      lang: 'ar',
    });

    return user;
  }

  static async update(id: string, input: UpdateUserInput, currentUserId: string, ipAddress?: string) {
    const existingUser = await this.findById(id);

    // The dedicated status endpoint refuses self-disable, but this general update accepted it, and
    // also let an account change its own role. Both are self-lockout / self-escalation routes.
    if (id === currentUserId) {
      if (input.status === 'DISABLED') {
        throw ApiError.badRequest('You cannot disable your own account');
      }
      if (input.roleId && input.roleId !== existingUser.roleId) {
        throw ApiError.badRequest('You cannot change your own role');
      }
    }

    if (input.email) {
      const existing = await prisma.user.findFirst({ where: { email: input.email, NOT: { id } } });
      if (existing) throw ApiError.badRequest('Email already in use');
    }

    let newRoleName: string | undefined;
    if (input.roleId) {
      const role = await prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role) throw ApiError.badRequest('Specified role does not exist');
      newRoleName = role.name;
    }

    await this.assertActorCanManage(currentUserId, [existingUser.role?.name, newRoleName]);

    let user;
    try {
      user = await prisma.user.update({
        where: { id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      handleUniqueConstraintError(error, 'Email already in use');
    }

    await logActivity({ action: 'UPDATE', entity: 'USER', entityId: user.id, userId: currentUserId, ipAddress });
    return user;
  }

  static async updatePassword(id: string, password: string, currentUserId: string, ipAddress?: string) {
    const existingUser = await this.findById(id);
    await this.assertActorCanManage(currentUserId, [existingUser.role?.name]);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.success) {
      throw ApiError.badRequest('Password policy violation', passwordValidation.errors);
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      }),
      prisma.session.deleteMany({ where: { userId: id } }),
    ]);

    await logActivity({ action: 'UPDATE_PASSWORD', entity: 'USER', entityId: id, userId: currentUserId, ipAddress });
    return { success: true, message: 'Password updated successfully' };
  }

  static async updateStatus(id: string, status: 'ACTIVE' | 'DISABLED', currentUserId: string, ipAddress?: string) {
    const existingUser = await this.findById(id);

    if (id === currentUserId && status === 'DISABLED') {
      throw ApiError.badRequest('You cannot disable your own account');
    }

    await this.assertActorCanManage(currentUserId, [existingUser.role?.name]);

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
      });

      if (status === 'DISABLED') {
        await tx.session.deleteMany({ where: { userId: id } });
      }

      return updated;
    });

    await logActivity({ action: 'UPDATE_STATUS', entity: 'USER', entityId: user.id, userId: currentUserId, ipAddress });
    return user;
  }

  static async softDelete(id: string, currentUserId: string, ipAddress?: string) {
    const existingUser = await this.findById(id);

    if (id === currentUserId) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    await this.assertActorCanManage(currentUserId, [existingUser.role?.name]);

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'DISABLED' },
      }),
      prisma.session.deleteMany({ where: { userId: id } }),
    ]);

    await logActivity({ action: 'DELETE', entity: 'USER', entityId: id, userId: currentUserId, ipAddress });
    return { success: true };
  }
}
