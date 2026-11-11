// The machine-readable files (docs/spec.md §10.3): RSS, llms.txt and robots.txt. Pure functions of
// the settings and the listed articles, so the routes stay one line and the tests need no build.
import type { ElucidateConfig } from '../config.ts';
import type { Article } from './articles.ts';

/** A listed article with its absolute URL. */
export interface FeedItem {
  article: Article;
  url: string;
}

const escapeXml = (text: string) =>
  text.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c,
  );

/** RSS 2.0: published articles, newest first. */
export function rss(
  config: ElucidateConfig,
  home: string,
  self: string,
  items: FeedItem[],
): string {
  const entries = items.map(
    ({ article: { data }, url }) => `    <item>
      <title>${escapeXml(data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(data.description)}</description>
      <pubDate>${data.date.toUTCString()}</pubDate>
    </item>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.title)}</title>
    <link>${escapeXml(home)}</link>
    <description>${escapeXml(config.description || config.title)}</description>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>
${entries.join('\n')}
  </channel>
</rss>
`;
}

/** llms.txt (llmstxt.org): the publication, then one line per published article. */
export function llmsTxt(config: ElucidateConfig, items: FeedItem[]): string {
  const lines = [`# ${config.title}`, ''];
  if (config.description) lines.push(`> ${config.description}`, '');
  lines.push('## Articles', '');
  for (const { article, url } of items) {
    lines.push(`- [${article.data.title}](${url}): ${article.data.description}`);
  }
  return `${lines.join('\n')}\n`;
}

/** robots.txt: everything may be crawled; the sitemap says what there is. */
export function robotsTxt(sitemap: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
}
