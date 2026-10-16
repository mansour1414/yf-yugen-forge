import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG } from '../config/seo';

interface StructuredDataProps {
  sameAs?: string[];
  email?: string;
  /** Real site origin (see getSiteOrigin in config/seo.ts). Falls back to the static SEO_CONFIG.siteUrl if not given. */
  url?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ sameAs = [], email = 'Hello.youssefalfaraj@gmail.com', url = SEO_CONFIG.siteUrl }) => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url,
    logo: `${url}/logo.svg`,
    ...(sameAs.length > 0 && { sameAs }),
    contactPoint: {
      '@type': 'ContactPoint',
      email,
      contactType: 'customer support',
      availableLanguage: ['Arabic', 'English'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
    </Helmet>
  );
};
