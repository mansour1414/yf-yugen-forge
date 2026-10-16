import { prisma } from '../../lib/prisma';
import { HeroService } from './hero.service';
import { SettingService } from './setting.service';
import { getLang, localizeHero, localizeService, localizeProject, localizeTestimonial, localizePricingPlan } from '../utils/i18n.util';

export class PublicService {
  static async getSettings() {
    return await SettingService.findPublic();
  }

  static async getHero(req?: any) {
    const lang = getLang(req);
    try {
      const hero = await HeroService.findCurrent();
      return localizeHero(hero, lang);
    } catch {
      return null;
    }
  }

  static async getServices(req?: any) {
    const lang = getLang(req);
    const services = await prisma.service.findMany({
      where: { active: true, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return services.map(s => localizeService(s, lang));
  }

  static async getPricingPlans(req?: any) {
    const lang = getLang(req);
    const plans = await prisma.pricingPlan.findMany({
      where: { active: true, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return plans.map((p) => localizePricingPlan(p, lang));
  }

  static async getProjects(req?: any) {
    const lang = getLang(req);
    const projects = await prisma.project.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: {
        media: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return projects.map(p => localizeProject(p, lang));
  }

  static async getTestimonials(req?: any) {
    const lang = getLang(req);
    let testimonials = await prisma.testimonial.findMany({
      where: { featured: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    if (testimonials.length === 0) {
      testimonials = await prisma.testimonial.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
    }
    return testimonials.map(t => localizeTestimonial(t, lang));
  }

  /**
   * Aggregates every public homepage section into one payload for
   * GET /api/public/home.
   *
   * Deliberately uses Promise.all(), NOT Promise.allSettled(). getHero()
   * already catches its own failure internally and resolves to `null` (a
   * missing/unconfigured hero section is a normal, expected condition — not
   * an error). The other five queries have no such guard: if one of them
   * throws (e.g. a transient DB connection issue during a cold start),
   * Promise.all() rejects the whole call, this method rejects, asyncHandler's
   * catch forwards it to the global error handler, and the endpoint returns
   * a real non-200 status.
   *
   * That real failure is required for the frontend's retry logic to work:
   * fetchWithRetry() (src/lib/api.ts) only retries when the request actually
   * fails. Promise.allSettled() was tried here in an earlier pass to reduce
   * the blast radius of one failing section, but it silently turned a failed
   * query into an empty array/null on a 200 response — the frontend then had
   * no way to tell "genuinely no data" apart from "the query failed," and
   * never retried a real backend failure. Reporting the failure honestly (via
   * Promise.all) and letting the frontend retry is the correct fix; masking
   * it at the aggregation layer is not.
   */
  static async getHome(req?: any) {
    const [hero, services, projects, testimonials, settings, pricingPlans] = await Promise.all([
      this.getHero(req),
      this.getServices(req),
      this.getProjects(req),
      this.getTestimonials(req),
      this.getSettings(),
      this.getPricingPlans(req),
    ]);

    return {
      hero,
      services,
      featuredProjects: projects,
      testimonials,
      settings,
      pricingPlans,
    };
  }
}
