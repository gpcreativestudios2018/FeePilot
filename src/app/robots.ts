import type { MetadataRoute } from 'next';

const isProd = process.env.VERCEL_ENV === 'production';
const site = 'https://fee-pilot.vercel.app';

export default function robots(): MetadataRoute.Robots {
  if (!isProd) {
    // Block indexing on preview/dev
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  // Production: allow and point to sitemap
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${site}/sitemap.xml`,
  };
}
