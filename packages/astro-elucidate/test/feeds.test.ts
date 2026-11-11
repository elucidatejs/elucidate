import { describe, expect, it } from 'vitest';
import { parseConfig } from '../src/config.ts';
import type { Article } from '../src/lib/articles.ts';
import { type FeedItem, llmsTxt, robotsTxt, rss } from '../src/lib/feeds.ts';

const config = parseConfig({ title: 'Lab & Notes', url: 'https://ada.github.io/lab' });
const item = (title: string, date: string): FeedItem => ({
  article: {
    id: 'x',
    data: { title, description: `About ${title}.`, date: new Date(date) },
  } as Article,
  url: `https://ada.github.io/lab/research/${title.toLowerCase()}/`,
});

describe('rss', () => {
  it('escapes text and dates items in RFC 822', () => {
    const xml = rss(config, 'https://ada.github.io/lab/', 'https://ada.github.io/lab/rss.xml', [
      item('<Graphs>', '2026-11-10'),
    ]);
    expect(xml).toContain('<title>Lab &amp; Notes</title>');
    expect(xml).toContain('<title>&lt;Graphs&gt;</title>');
    expect(xml).toContain('<pubDate>Tue, 10 Nov 2026 00:00:00 GMT</pubDate>');
    // RSS needs a channel description; the title stands in for an empty one.
    expect(xml).toContain('<description>Lab &amp; Notes</description>');
  });
});

describe('llms.txt', () => {
  it('leaves out the summary line without a description', () => {
    expect(llmsTxt(config, [item('Graphs', '2026-11-10')])).toBe(
      '# Lab & Notes\n\n## Articles\n\n- [Graphs](https://ada.github.io/lab/research/graphs/): About Graphs.\n',
    );
  });
});

it('points robots.txt to the sitemap', () => {
  expect(robotsTxt('https://ada.github.io/lab/sitemap-index.xml')).toContain(
    'Sitemap: https://ada.github.io/lab/sitemap-index.xml',
  );
});
