import { listedArticles } from './articles.ts';
import type { FeedItem } from './feeds.ts';
import { articlePath } from './paths.ts';

/** Published articles, newest first, with absolute URLs on `site`. */
export async function feedItems(site: URL): Promise<FeedItem[]> {
  return (await listedArticles()).map((article) => ({
    article,
    url: new URL(articlePath(article.id), site).href,
  }));
}
