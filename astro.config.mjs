// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeFill } from './src/lib/rehype-fill.mjs';

export default defineConfig({
  // [ЗАПОЛНИТЬ: домен сайта] — нужен для canonical, sitemap и Open Graph
  site: 'https://example.ru',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  markdown: { processor: unified({ rehypePlugins: [rehypeFill] }) },
  vite: {
    plugins: [tailwindcss()],
    // В режиме разработки форма отправляется на локальный сервер (npm run dev:api)
    server: { proxy: { '/api': 'http://localhost:8787' } },
  },
});
