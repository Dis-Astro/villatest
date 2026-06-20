import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://villaparis.rosetoabruzzo.it',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => {
        const exclude = ['/contatti/grazie', '/en/contacts/thank-you'];
        return !exclude.some(p => page.includes(p));
      },
      lastmod: new Date(),
      changefreq: 'weekly',
      priority: 0.7
    })
  ],
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  },
  build: {
    assets: 'assets',
    format: 'file'
  }
});
