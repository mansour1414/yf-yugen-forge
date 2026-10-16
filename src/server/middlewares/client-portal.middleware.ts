import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * Guards the Client Portal API surface: only users with the Client role may
 * pass, and req.clientId is always resolved server-side from the
 * authenticated user's own record — it is never taken from the request body,
 * query string, or URL params, so a client can never view or act on another
 * client's data.
 */
export async function requireClientProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.user.role !== 'Client') {
      return res.status(403).json({ success: false, error: 'Forbidden: this endpoint is for client accounts only' });
    }

    const client = await prisma.client.findFirst({
      where: { userId: req.user.userId, deletedAt: null },
      select: { id: true, user: { select: { status: true, deletedAt: true } } },
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client profile not found' });
    }

    // Same reasoning as requirePermission: a still-valid access token must not keep working
    // after the account has been disabled or deleted.
    if (!client.user || client.user.status !== 'ACTIVE' || client.user.deletedAt) {
      return res.status(403).json({ success: false, error: 'Forbidden: Account is disabled' });
    }

    req.clientId = client.id;
    next();
  } catch (error) {
    console.error('requireClientProfile error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
