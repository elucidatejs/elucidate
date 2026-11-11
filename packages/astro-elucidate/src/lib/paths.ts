import config from 'virtual:elucidate/config';

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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
