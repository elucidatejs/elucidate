import type { Article, Hero, PluginData } from '../../types.ts';

/** What the article route puts in `Astro.locals.elucidate` for a bespoke article's blocks. */
export interface ArticleContext {
  article: Article;
  plugin: PluginData;
  hero: Hero | undefined;
  /** The article's canonical URL. */
  url: string;
}

/** The current article, for the blocks of a `layout: bespoke` article (docs/spec.md §9.4). */
export function articleContext(locals: object, block: string): ArticleContext {
  const context = (locals as { elucidate?: ArticleContext }).elucidate;
  if (!context) {
    throw new Error(
      `<${block} /> shows parts of the current article, so it works only in an article with layout: bespoke.`,
    );
  }
  return context;
}
