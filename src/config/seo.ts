export const SEO_CONFIG = {
  siteName: 'YF Digital Studio',
  siteUrl: 'https://yf-yugen-forge.vercel.app',
  defaultTitle: 'YF Digital Studio — نبني المستقبل الرقمي',
  defaultDescription: 'استوديو إبداعي رقمي نبني فيه مواقع وتطبيقات وحلول ذكاء اصطناعي وتجارب رقمية استثنائية.',
  defaultImage: 'https://yf-yugen-forge.vercel.app/hero-bg.jpg',
  twitter: '@yf_studio',
  author: 'YF Digital Studio',
  keywords: 'تطوير مواقع, تطبيقات ويب, ذكاء اصطناعي, تصميم UI/UX, هوية بصرية, الدمام, السعودية',
};

/**
 * Resolves the real site origin to build canonical/OG URLs from, without hardcoding a
 * potentially-wrong production domain into every page.
 * Priority: an explicit VITE_SITE_URL env var (set this if the site is deployed behind a
 * different domain than the browser sees, e.g. a proxy) → the browser's actual origin →
 * the static SEO_CONFIG.siteUrl as a last-resort fallback (SSR/build-time only).
 */
export function getSiteOrigin(): string {
  const envUrl = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return SEO_CONFIG.siteUrl;
}
