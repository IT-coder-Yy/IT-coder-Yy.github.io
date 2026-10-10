// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
const site = process.env.SITE_URL?.trim();
const requestedBase = process.env.BASE_PATH?.trim() || '/';
const base = requestedBase === '/'
  ? '/'
  : `/${requestedBase.replace(/^\/+|\/+$/g, '')}`;

export default defineConfig({
  devToolbar: { enabled: false },
  site: site || undefined,
  base,
  integrations: site ? [sitemap()] : [],
});
