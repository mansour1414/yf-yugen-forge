import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { UpdateHeroInput } from '../types/hero.schema';

export class HeroService {
  static async findCurrent() {
    const activeHero = await prisma.heroSection.findFirst({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (activeHero) return activeHero;

    const hero = await prisma.heroSection.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!hero) throw ApiError.notFound('Hero section not found');
    return hero;
  }

  static async update(id: string, input: UpdateHeroInput, userId: string, ipAddress?: string) {
    const existing = await prisma.heroSection.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Hero section not found');

    const hero = await prisma.heroSection.update({ where: { id }, data: input });
    await logActivity({ action: 'UPDATE', entity: 'HERO_SECTION', entityId: hero.id, userId, ipAddress });
    return hero;
  }
}
