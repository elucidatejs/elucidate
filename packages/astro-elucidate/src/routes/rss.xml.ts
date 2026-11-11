import config from 'virtual:elucidate/config';
import type { APIRoute } from 'astro';
import { feedItems } from '../lib/feed-items.ts';
import { rss } from '../lib/feeds.ts';
import { withBase } from '../lib/paths.ts';

export const GET: APIRoute = async ({ site = new URL(config.url) }) => {
  const body = rss(
    config,
    new URL(withBase('/'), site).href,
    new URL(withBase('/rss.xml'), site).href,
    await feedItems(site),
  );
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
