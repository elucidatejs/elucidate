import { getCollection } from 'astro:content';
import type { ArticleData } from '../schema/article.ts';

export interface Article {
  id: string;
  data: ArticleData;
}

async function all(): Promise<Article[]> {
  return (await getCollection('articles')) as Article[];
}

/** Articles that get a page: everything in dev; everything except drafts in production. */
export async function builtArticles(): Promise<Article[]> {
  return (await all()).filter((a) => import.meta.env.DEV || a.data.status !== 'draft');
}

/** Articles shown in the index, tag pages and feeds: published only, newest first. */
export async function listedArticles(tag?: string): Promise<Article[]> {
  return (await all())
    .filter((a) => a.data.status === 'published' && (!tag || a.data.tags.includes(tag)))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Tags used by listed articles, alphabetically. */
export async function listedTags(): Promise<string[]> {
  const tags = new Set((await listedArticles()).flatMap((a) => a.data.tags));
  return [...tags].sort((a, b) => a.localeCompare(b));
}
