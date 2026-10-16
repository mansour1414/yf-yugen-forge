import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { SEO_CONFIG, getSiteOrigin } from '../config/seo';
import { StructuredData } from './StructuredData';
import { api } from '../lib/api';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  /** Explicit absolute canonical URL override. If omitted, it's built from the site origin + `path`. */
  canonical?: string;
  /** Relative path used to build the canonical/OG URL when `canonical` isn't given. Defaults to the current URL. */
  path?: string;
  image?: string;
  type?: string;
  /** Explicit robots override (e.g. "noindex, nofollow" for private pages). Takes priority over the CMS setting. */
  robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  path,
  image,
  type = 'website',
  robots,
}) => {
  const { i18n } = useTranslation();
  const [cmsSettings, setCmsSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    api.get('/api/public/settings')
      .then((res) => {
        const items = res.data?.data || [];
        const map: Record<string, any> = {};
        items.forEach((s: any) => {
          map[s.key] = s.parsedValue !== undefined ? s.parsedValue : s.value;
        });
        setCmsSettings(map);
      })
      .catch(() => {});
  }, []);

  const lang = i18n.language === 'en' ? 'en' : 'ar';

  // Reads `${base}_ar` / `${base}_en` from the CMS, falling back to the old
  // single-language key (e.g. `seo_title`) for sites that haven't re-saved the
  // new bilingual fields yet — nothing here requires a database migration.
  const pickLocalized = (base: string): string | undefined =>
    cmsSettings[`${base}_${lang}`] || cmsSettings[base] || undefined;

  const resolvedTitle = title || pickLocalized('seo_title') || SEO_CONFIG.defaultTitle;
  const resolvedDescription = description || pickLocalized('seo_description') || SEO_CONFIG.defaultDescription;
  const resolvedKeywords = keywords || pickLocalized('seo_keywords') || SEO_CONFIG.keywords;
  const resolvedImage = image || cmsSettings.seo_image || SEO_CONFIG.defaultImage;

  const ogTitle = pickLocalized('seo_og_title') || resolvedTitle;
  const ogDescription = pickLocalized('seo_og_description') || resolvedDescription;
  const ogImage = cmsSettings.seo_og_image || resolvedImage;

  const resolvedRobots = robots || cmsSettings.seo_robots || 'index, follow';

  const origin = getSiteOrigin();
  const currentPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  // The CMS "Canonical URL" override is a single site-wide field, so it only applies
  // to the homepage — other pages always canonicalize to their own real URL.
  const autoCanonical = `${origin}${currentPath}`;
  const resolvedCanonical = canonical || (currentPath === '/' && cmsSettings.seo_canonical_url) || autoCanonical;

  const socialLinks = [
    cmsSettings.social_x_enabled && cmsSettings.social_x_url,
    cmsSettings.social_linkedin_enabled && cmsSettings.social_linkedin_url,
    cmsSettings.social_instagram_enabled && cmsSettings.social_instagram_url,
    cmsSettings.social_tiktok_enabled && cmsSettings.social_tiktok_url,
  ].filter((url): url is string => Boolean(url));

  return (
    <>
      <StructuredData sameAs={socialLinks} email={cmsSettings.contact_email} url={origin} />
      <Helmet>
        {/* Standard metadata tags */}
        <title>{resolvedTitle}</title>
        <meta name="description" content={resolvedDescription} />
        <meta name="keywords" content={resolvedKeywords} />
        <meta name="robots" content={resolvedRobots} />
        <link rel="canonical" href={resolvedCanonical} />

        {/* Search engine site-ownership verification — only rendered when a code is actually set */}
        {cmsSettings.seo_google_verification && <meta name="google-site-verification" content={cmsSettings.seo_google_verification} />}
        {cmsSettings.seo_bing_verification && <meta name="msvalidate.01" content={cmsSettings.seo_bing_verification} />}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={resolvedCanonical} />
        <meta property="og:site_name" content={SEO_CONFIG.siteName} />
        <meta property="og:locale" content={lang === 'ar' ? 'ar_SA' : 'en_US'} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:site" content={SEO_CONFIG.twitter} />
      </Helmet>
    </>
  );
};
