// The public endpoints (/api/public/*) are readable by anyone, so each localize*() function below
// builds its result from an explicit allow-list of fields. They used to spread the whole database
// row (`...project`), which published internal columns: repositoryUrl, githubUrl, figmaUrl,
// clientId, createdBy, seo fields, timestamps, deletedAt... Adding a column to the Prisma model
// no longer changes what the public API exposes.

export function getLang(req: any): 'ar' | 'en' {
  const acceptLang = req.headers['accept-language'] || '';
  const queryLang = req.query?.lang;
  if (queryLang === 'en' || queryLang === 'ar') return queryLang;
  if (acceptLang.includes('en')) return 'en';
  return 'ar';
}

export function localizeHero(hero: any, lang: 'ar' | 'en') {
  if (!hero) return null;
  return {
    id: hero.id,
    title: lang === 'en' ? (hero.titleEn || hero.title) : (hero.titleAr || hero.title),
    subtitle: lang === 'en' ? (hero.subtitleEn || hero.subtitle) : (hero.subtitleAr || hero.subtitle),
    buttonText: lang === 'en' ? (hero.buttonTextEn || hero.buttonText) : (hero.buttonTextAr || hero.buttonText),
    buttonLink: hero.buttonLink,
    videoUrl: hero.videoUrl ?? null,
    background: hero.background ?? null,
    active: hero.active,
  };
}

export function localizeService(service: any, lang: 'ar' | 'en') {
  if (!service) return null;
  return {
    id: service.id,
    title: lang === 'en' ? (service.titleEn || service.title) : (service.titleAr || service.title),
    description: lang === 'en' ? (service.descriptionEn || service.description) : (service.descriptionAr || service.description),
    icon: service.icon,
    color: service.color,
    featured: service.featured,
    displayOrder: service.displayOrder,
  };
}

export function localizeProject(project: any, lang: 'ar' | 'en') {
  if (!project) return null;
  return {
    id: project.id,
    slug: project.slug,
    title: lang === 'en' ? (project.titleEn || project.title) : (project.titleAr || project.title),
    shortDescription: lang === 'en' ? (project.shortDescriptionEn || project.shortDescription) : (project.shortDescriptionAr || project.shortDescription),
    description: lang === 'en' ? (project.descriptionEn || project.description) : (project.descriptionAr || project.description),
    category: lang === 'en' ? (project.categoryEn || project.category) : (project.categoryAr || project.category),
    type: lang === 'en' ? (project.typeEn || project.type) : (project.typeAr || project.type),
    coverImage: project.coverImage,
    thumbnail: project.thumbnail,
    liveUrl: project.liveUrl ?? null,
    featured: project.featured,
    displayOrder: project.displayOrder,
    media: Array.isArray(project.media)
      ? project.media.map((item: any) => ({
          id: item.id,
          name: item.name ?? null,
          type: item.type,
          url: item.url,
          alt: item.alt ?? null,
          displayOrder: item.displayOrder,
        }))
      : [],
  };
}

export function localizePricingPlan(plan: any, lang: 'ar' | 'en') {
  if (!plan) return null;
  const featuresAr = plan.featuresAr || [];
  const featuresEn = plan.featuresEn || [];
  return {
    id: plan.id,
    tier: lang === 'en' ? (plan.tierEn || plan.tierAr) : (plan.tierAr || plan.tierEn),
    price: plan.price,
    isCustom: plan.isCustom,
    desc: lang === 'en' ? (plan.descEn || plan.descAr) : (plan.descAr || plan.descEn),
    feats: lang === 'en' ? (featuresEn.length ? featuresEn : featuresAr) : (featuresAr.length ? featuresAr : featuresEn),
    featured: plan.featured,
  };
}

export function localizeTestimonial(testimonial: any, lang: 'ar' | 'en') {
  if (!testimonial) return null;
  return {
    id: testimonial.id,
    name: testimonial.name,
    company: testimonial.company,
    position: lang === 'en' ? (testimonial.positionEn || testimonial.position) : (testimonial.positionAr || testimonial.position),
    avatar: testimonial.avatar ?? null,
    rating: testimonial.rating,
    content: lang === 'en' ? (testimonial.contentEn || testimonial.content) : (testimonial.contentAr || testimonial.content),
  };
}
