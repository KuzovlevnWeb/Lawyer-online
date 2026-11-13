// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeFill } from './src/lib/rehype-fill.mjs';

export default defineConfig({
  // Адрес сайта для canonical, sitemap и Open Graph — переменная окружения SITE_URL
  // [ЗАПОЛНИТЬ: домен сайта] — после покупки домена укажите его в SITE_URL
  site: process.env.SITE_URL || 'https://example.ru',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  markdown: { processor: unified({ rehypePlugins: [rehypeFill] }) },
  vite: {
    plugins: [tailwindcss()],
    // В режиме разработки форма отправляется на локальный сервер (npm run dev:api)
    server: { proxy: { '/api': 'http://localhost:8787' } },
  },
});
