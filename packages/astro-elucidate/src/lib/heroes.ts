import type { ImageMetadata } from 'astro';

// Hero convention (docs/spec.md §7.4): Hero.astro or hero.<image> in the article folder.
const components = import.meta.glob<{ default: unknown }>('/src/articles/*/Hero.astro', {
  eager: true,
});
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/articles/*/hero.{svg,png,jpg,jpeg,webp,avif}',
  { eager: true },
);

export interface Hero {
  component?: unknown;
  image?: ImageMetadata;
  file: string;
}

export function heroFor(slug: string): Hero | undefined {
  const prefix = `/src/articles/${slug}/`;
  const component = Object.entries(components).find(([path]) => path.startsWith(prefix));
  if (component) return { component: component[1].default, file: component[0].slice(1) };
  const image = Object.entries(images).find(([path]) => path.startsWith(prefix));
  if (image) return { image: image[1].default, file: image[0].slice(1) };
  return undefined;
}
