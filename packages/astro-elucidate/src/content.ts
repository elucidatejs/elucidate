import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { articleSchema } from './schema/article.ts';

/**
 * Content collections for an Elucidate site. Re-export them from `src/content.config.ts`:
 * `export { collections } from 'astro-elucidate/content'`.
 */
export const collections = {
  articles: defineCollection({
    // One folder per article; the folder name is the ID and URL slug.
    loader: glob({
      pattern: '*/index.{md,mdx}',
      base: './src/articles',
      generateId: ({ entry }) => entry.split('/')[0] ?? entry,
    }),
    schema: articleSchema,
  }),
};
