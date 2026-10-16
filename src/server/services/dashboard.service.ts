import { prisma } from '../../lib/prisma';

export class DashboardService {
  static async getDashboardStats() {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      activeClients,
      totalMessages,
      unreadMessages,
      totalServices,
      activeServices,
      totalMedia,
      totalUsers,
      recentProjects,
      recentClients,
      recentMessages,
      latestActivityLogs,
      monthlyTrends,
    ] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.project.count({ where: { status: 'COMPLETED', deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.message.count(),
      prisma.message.count({ where: { isRead: false } }),
      prisma.service.count({ where: { deletedAt: null } }),
      prisma.service.count({ where: { active: true, deletedAt: null } }),
      prisma.media.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { client: { select: { companyName: true } } },
      }),
      prisma.client.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { service: { select: { title: true } } },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      DashboardService.getMonthlyTrends(),
    ]);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      activeClients,
      totalMessages,
      unreadMessages,
      totalServices,
      activeServices,
      totalMedia,
      totalUsers,
      recentProjects,
      recentClients,
      recentMessages,
      latestActivityLogs,
      monthlyTrends,
    };
  }

  /**
   * Real, DB-backed counts of records created in each of the last 6 calendar
   * months (current month included) — used to draw the dashboard trend
   * chart. No new tables/columns needed: this just buckets existing
   * `createdAt` timestamps that were already being queried elsewhere.
   */
  static async getMonthlyTrends() {
    const now = new Date();
    const months: { start: Date; end: Date; key: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      months.push({ start, end, key });
    }

    const counts = await Promise.all(
      months.map(({ start, end }) =>
        Promise.all([
          prisma.project.count({ where: { deletedAt: null, createdAt: { gte: start, lt: end } } }),
          prisma.client.count({ where: { deletedAt: null, createdAt: { gte: start, lt: end } } }),
          prisma.message.count({ where: { createdAt: { gte: start, lt: end } } }),
        ])
      )
    );

    return months.map(({ key, start }, i) => ({
      month: key,
      monthStartIso: start.toISOString(),
      projects: counts[i][0],
      clients: counts[i][1],
      messages: counts[i][2],
    }));
  }
}
