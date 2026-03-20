import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://villaparis.rosetoabruzzo.it',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap()
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
