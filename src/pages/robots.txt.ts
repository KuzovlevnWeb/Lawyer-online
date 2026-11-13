import type { APIRoute } from 'astro';

// robots.txt собирается автоматически из SITE_URL.
// SITE_NOINDEX=1 закрывает сайт от поисковиков (пока заполняются данные).
export const GET: APIRoute = ({ site }) => {
  const closed = process.env.SITE_NOINDEX === '1';
  const body = closed
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
