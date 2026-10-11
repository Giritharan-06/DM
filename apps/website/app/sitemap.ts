import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
  return ['', '/privacy', '/terms'].map((path) => ({
    url: base + path,
    changeFrequency: 'monthly' as const,
    priority: path ? 0.3 : 1,
  }));
}
