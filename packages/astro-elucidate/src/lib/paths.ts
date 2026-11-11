import config from 'virtual:elucidate/config';
import { slugify } from './slugify.ts';

export { slugify };

/** Prefixes a site-internal path with Astro's base; leaves external URLs alone. */
export function withBase(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('#')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/** URL of the article index. */
export function indexPath(): string {
  return withBase(config.home === 'index' ? '/' : `/${config.routes.articles}/`);
}

export function articlePath(slug: string): string {
  return withBase(`/${config.routes.articles}/${slug}/`);
}

export function tagPath(tag: string): string {
  return withBase(`/${config.routes.articles}/tag/${slugify(tag)}/`);
}

/**
 * Title of the article index: the site title when the index is the homepage; otherwise the label
 * of the menu item that points to it, since the site title then belongs to the homepage.
 */
export function indexTitle(): string {
  if (config.home === 'index') return config.title;
  return config.nav.find((item) => withBase(item.href) === indexPath())?.label ?? 'Articles';
}
