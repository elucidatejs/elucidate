// Props of the structural components (docs/spec.md §9.2), for overrides (§11.5):
//
//   ---
//   import type { BylineProps } from 'astro-elucidate/types';
//   type Props = BylineProps;
//   ---
import type { Article } from './lib/articles.ts';
import type { Hero } from './lib/heroes.ts';
import type { HeadingData, PluginData } from './markdown/shared.ts';

export type { Palette } from './palette.ts';
export type { Article, HeadingData, Hero, PluginData };

export interface HeadProps {
  title: string;
  description?: string | undefined;
  /** Adds `robots: noindex`, e.g. for articles in review. */
  noindex?: boolean | undefined;
  /** Open Graph type. */
  ogType?: 'website' | 'article' | undefined;
  /** Absolute URL of the social preview image (an article's image hero). */
  image?: string | undefined;
}

/** The header reads the site settings; it takes no props. */
export type HeaderProps = Record<string, never>;

/** The footer reads the site settings; it takes no props. */
export type FooterProps = Record<string, never>;

export interface ArticleHeroProps {
  article: Article;
  /** The article's `Hero.astro` or `hero.*` image, if it has one. */
  hero?: Hero | undefined;
}

export interface BylineProps {
  article: Article;
}

export interface TableOfContentsProps {
  /** From the numbering plugin; `number` is set when section numbering is on. */
  headings: HeadingData[];
  /** `disclosure` sits under the byline below 1280px; `float` sits in the left margin. */
  variant: 'disclosure' | 'float';
}

export interface AppendixProps {
  article: Article;
  /** What the Markdown plugins collected: footnotes, references, headings. */
  plugin: PluginData;
  /** The article's canonical URL. */
  url: string;
}

export interface ArticleCardProps {
  article: Article;
}
