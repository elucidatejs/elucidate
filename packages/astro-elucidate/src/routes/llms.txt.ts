import config from 'virtual:elucidate/config';
import type { APIRoute } from 'astro';
import { feedItems } from '../lib/feed-items.ts';
import { llmsTxt } from '../lib/feeds.ts';

export const GET: APIRoute = async ({ site = new URL(config.url) }) =>
  new Response(llmsTxt(config, await feedItems(site)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
