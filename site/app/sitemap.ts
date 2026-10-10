import type { MetadataRoute } from 'next';
import { siteUrl } from './site-url';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: new URL('/', siteUrl).href, changeFrequency: 'monthly', priority: 1 }];
}
