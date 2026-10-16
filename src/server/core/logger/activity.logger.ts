import { prisma } from '../../../lib/prisma';

interface LogActivityParams {
  action: string;
  entity: string;
  entityId: string;
  userId?: string | null;
  ipAddress?: string | null;
  oldValues?: any;
  newValues?: any;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
