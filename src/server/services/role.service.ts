import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { getPaginationParams, createPaginationResult } from '../core/pagination/pagination.util';
import { buildPrismaQuery } from '../core/query/query.util';
import { CreateRoleInput, ROLE_SORT_FIELDS, UpdateRoleInput } from '../types/role.schema';

interface RoleQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class RoleService {
  /**
   * The backend enforces permissions by name (there is no "Admin bypass" server-side — the
   * bypass in PermissionGuard is UI-only), so stripping a permission from the Admin role can lock
   * every administrator out of a whole area until the seed script is re-run. Additions are fine;
   * removals from the Admin role are refused.
   */
  private static assertAdminKeepsPermissions(
    role: { name: string; permissions: Array<{ permission: { id: string } }> },
    nextPermissionIds: string[]
  ) {
    if (role.name !== 'Admin') return;
    const next = new Set(nextPermissionIds);
    if (role.permissions.some((rp) => !next.has(rp.permission.id))) {
      throw ApiError.badRequest('Permissions cannot be removed from the built-in Admin role');
    }
  }

  static async findAll(options: RoleQueryOptions) {
    const { page, limit, skip } = getPaginationParams(options);
    const { where, orderBy } = buildPrismaQuery({
      search: options.search,
      searchFields: ['name', 'description'],
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      sortableFields: ROLE_SORT_FIELDS,
      excludeSoftDeleted: false,
    });

    const [total, roles] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: { select: { users: true, permissions: true } },
          permissions: { include: { permission: true } },
        },
      }),
    ]);

    return { data: roles, pagination: createPaginationResult(total, page, limit) };
  }

  static async findById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        permissions: { include: { permission: true } },
      },
    });

    if (!role) throw ApiError.notFound('Role not found');
    return role;
  }

  static async findAllPermissions() {
    return await prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  static async create(input: CreateRoleInput, userId: string, ipAddress?: string) {
    const existing = await prisma.role.findUnique({ where: { name: input.name } });
    if (existing) {
      throw ApiError.badRequest('Role name already exists');
    }

    const { permissionIds, ...roleData } = input;

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: roleData,
      });

      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: newRole.id,
            permissionId,
          })),
        });
      }

      return await tx.role.findUnique({
        where: { id: newRole.id },
        include: {
          _count: { select: { users: true, permissions: true } },
          permissions: { include: { permission: true } },
        },
      });
    });

    await logActivity({ action: 'CREATE', entity: 'ROLE', entityId: role!.id, userId, ipAddress });
    return role;
  }

  static async update(id: string, input: UpdateRoleInput, userId: string, ipAddress?: string) {
    const role = await this.findById(id);

    if (role.name === 'Admin' && input.name && input.name !== 'Admin') {
      throw ApiError.badRequest('Cannot rename the built-in Admin role');
    }

    if (input.name && input.name !== role.name) {
      const existing = await prisma.role.findUnique({ where: { name: input.name } });
      if (existing) throw ApiError.badRequest('Role name already exists');
    }

    const { permissionIds, ...roleData } = input;

    if (permissionIds !== undefined) {
      this.assertAdminKeepsPermissions(role, permissionIds);
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: roleData,
      });

      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      return await tx.role.findUnique({
        where: { id },
        include: {
          _count: { select: { users: true, permissions: true } },
          permissions: { include: { permission: true } },
        },
      });
    });

    await logActivity({ action: 'UPDATE', entity: 'ROLE', entityId: id, userId, ipAddress });
    return updatedRole;
  }

  static async updatePermissions(id: string, permissionIds: string[], userId: string, ipAddress?: string) {
    const role = await this.findById(id);
    this.assertAdminKeepsPermissions(role, permissionIds);

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      ...(permissionIds.length > 0
        ? [
            prisma.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({
                roleId: id,
                permissionId,
              })),
            }),
          ]
        : []),
    ]);

    const updated = await this.findById(id);
    await logActivity({ action: 'UPDATE_PERMISSIONS', entity: 'ROLE', entityId: id, userId, ipAddress });
    return updated;
  }

  static async delete(id: string, userId: string, ipAddress?: string) {
    const role = await this.findById(id);

    if (role.name === 'Admin') {
      throw ApiError.badRequest('Cannot delete the built-in Admin role');
    }

    if (role._count.users > 0) {
      throw ApiError.badRequest('Cannot delete role assigned to active users');
    }

    await prisma.role.delete({ where: { id } });
    await logActivity({ action: 'DELETE', entity: 'ROLE', entityId: id, userId, ipAddress });
    return { success: true };
  }
}
