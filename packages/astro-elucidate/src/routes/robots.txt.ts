import config from 'virtual:elucidate/config';
import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/feeds.ts';
import { withBase } from '../lib/paths.ts';

export const GET: APIRoute = ({ site = new URL(config.url) }) =>
  new Response(robotsTxt(new URL(withBase('/sitemap-index.xml'), site).href), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
