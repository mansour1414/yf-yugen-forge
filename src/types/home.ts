/**
 * Shared types for the public homepage data, matching what
 * PublicService.getHome() (src/server/services/public.service.ts) returns
 * from GET /api/public/home. Each field's shape is identical to what its
 * standalone endpoint already returns (e.g. `services` matches
 * /api/public/services) — getHome() just aggregates the same localized
 * query results, so these types are safe to reuse anywhere those individual
 * endpoints are also consumed.
 */

export interface HeroData {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  videoUrl?: string | null;
  background?: string | null;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  featured: boolean;
  displayOrder: number;
}

export interface ProjectMediaItem {
  id: string;
  name?: string | null;
  type: string;
  url: string;
  alt?: string | null;
  displayOrder: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  type: string;
  coverImage: string;
  thumbnail: string;
  featured: boolean;
  displayOrder: number;
  media?: ProjectMediaItem[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  position?: string | null;
  avatar?: string | null;
  rating: number;
  content: string;
}

export interface PricingPlanItem {
  id: string;
  tier: string;
  price: string;
  isCustom: boolean;
  desc: string;
  feats: string[];
  featured: boolean;
}

export interface PublicSettingItem {
  id: string;
  key: string;
  value: string;
  parsedValue?: any;
  type: string;
  group: string;
  description?: string | null;
  isPublic: boolean;
}

export interface HomeApiResponse {
  hero: HeroData | null;
  services: ServiceItem[];
  featuredProjects: ProjectItem[];
  testimonials: TestimonialItem[];
  settings: PublicSettingItem[];
  pricingPlans: PricingPlanItem[];
}
