import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
      }

      // Load the user with ONLY the one permission being checked (instead of the role's whole
      // permission table on every request), plus the fields needed to reject a disabled account.
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          status: true,
          deletedAt: true,
          role: {
            select: {
              permissions: {
                where: { permission: { name: permissionName } },
                select: { roleId: true },
              },
            },
          },
        },
      });

      if (!user || !user.role) {
        return res.status(403).json({ success: false, error: 'Forbidden: User role not found' });
      }

      // A JWT stays valid until it expires (15 min), so disabling or deleting a user must be
      // enforced here, against the database, rather than trusting the token alone.
      if (user.status !== 'ACTIVE' || user.deletedAt) {
        return res.status(403).json({ success: false, error: 'Forbidden: Account is disabled' });
      }

      if (user.role.permissions.length === 0) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Insufficient permissions (Required: ${permissionName})`,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error during permission verification' });
    }
  };
}

/**
 * Restricts a route to the built-in Admin role, checked against the database (not the JWT claim).
 * Used for privilege management (creating/editing roles): a plain permission such as `users.update`
 * must not be enough to mint a role with every permission.
 */
export async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { status: true, deletedAt: true, role: { select: { name: true } } },
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      return res.status(403).json({ success: false, error: 'Forbidden: Account is disabled' });
    }

    if (user.role?.name !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin role required' });
    }

    next();
  } catch (error) {
    console.error('Admin role check error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error during permission verification' });
  }
}
