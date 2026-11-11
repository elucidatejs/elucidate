// Builds a small site customized the ways docs/customizing.md describes, as a user would: a
// homepage of its own under a project path, a Byline override, a registered component of its own,
// and a bespoke article.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('./fixtures/site/', import.meta.url));
const outDir = mkdtempSync(join(tmpdir(), 'elucidate-site-'));
const page = (path: string) => readFileSync(join(outDir, path, 'index.html'), 'utf8');
const file = (path: string) => readFileSync(join(outDir, path), 'utf8');

beforeAll(() => {
  // The fixture imports the engine by its package name, as a site does.
  const link = join(root, 'node_modules/astro-elucidate');
  if (!existsSync(link)) {
    mkdirSync(join(root, 'node_modules'), { recursive: true });
    symlinkSync(fileURLToPath(new URL('../', import.meta.url)), link, 'junction');
  }
  // A separate process in the fixture folder, as `astro build` runs on a site.
  const astro = join(
    dirname(createRequire(import.meta.url).resolve('astro/package.json')),
    'bin/astro.mjs',
  );
  // Without Vitest's own import.meta.env values, such as BASE_URL, which Vite would take over.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !['BASE_URL', 'MODE', 'DEV', 'PROD', 'SSR', 'NODE_ENV'].includes(key),
    ),
  );
  execFileSync(process.execPath, [astro, 'build', '--outDir', outDir, '--silent'], {
    cwd: root,
    env,
    stdio: 'pipe',
  });
}, 120_000);

describe('a customized site', () => {
  it('renders the Byline override, which wraps the original', () => {
    const html = page('research/standard');
    expect(html).toContain('<div class="custom-byline" data-authors="1"');
    expect(html).toMatch(/class="custom-byline"[^>]*>\s*<div class="el-byline"/);
  });

  it('makes registered components available in MDX without an import', () => {
    expect(page('research/standard')).toContain(
      '<div class="callout" data-tone="info">Registered components need no import.</div>',
    );
  });

  it('keeps a one-line block component out of a paragraph', () => {
    const html = page('research/standard');
    expect(html).toContain('<aside class="el-aside">');
    expect(html).not.toMatch(/<p>\s*<aside/);
  });

  it('builds a bespoke article from its blocks, without the site header and footer', () => {
    const html = page('research/essay');
    expect(html).not.toContain('<header class="el-header"');
    expect(html).not.toContain('<footer class="el-footer"');
    expect(html).toContain('<header class="el-title-block el-grid"');
    // The blocks use the same overrides as the standard layout.
    expect(html).toContain('<div class="custom-byline" data-authors="2"');
    expect(html).toContain('<section class="el-abstract"');
    expect(html).toContain('<div class="el-appendix el-grid"');
    expect(html).toContain('id="fn-1"');
    expect(html).toContain('<meta name="citation_title" content="A bespoke essay"');
  });

  it('lists built-in and registered components on /components/, kept out of search engines', () => {
    const html = page('components');
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    for (const name of ['Figure', 'Block', 'Aside', 'Note', 'Button', 'Overlay', 'Callout']) {
      expect(html).toContain(`>${name}</h2>`);
    }
    expect(html).toContain('<div class="callout" data-tone="warning">An example callout.</div>');
  });
});

describe('a homepage of its own, under a project path', () => {
  it('renders src/pages/index.mdx at / with the latest articles from ArticleList', () => {
    const html = page('');
    expect(html).toContain('<h1 class="el-title">Fixture</h1>');
    expect(html.match(/class="el-card"/g)).toHaveLength(1);
    expect(html).toContain('href="/journal/research/standard/"');
  });

  it('adds the base path to root links in Markdown, and leaves anchors alone', () => {
    const html = page('');
    expect(html).toContain('<a href="/journal/research/">all research</a>');
    expect(html).toContain('<a href="#latest">an anchor</a>');
  });

  it('moves the index to /research/, titled by its menu item', () => {
    const html = page('research');
    expect(html).toContain('<title>Research · Fixture</title>');
    expect(html).toContain('<h1 class="el-title">Research</h1>');
    expect(html.match(/class="el-card"/g)).toHaveLength(2);
    expect(html).not.toContain('An article in review');
  });
});

describe('feeds and machine-readable files', () => {
  it('lists published articles in rss.xml, newest first, with absolute URLs', () => {
    const xml = file('rss.xml');
    expect(xml).toContain('<link>https://example.org/journal/</link>');
    expect(xml).toContain('href="https://example.org/journal/rss.xml" rel="self"');
    const links = [...xml.matchAll(/<item>\s*<title>[^<]*<\/title>\s*<link>([^<]+)/g)].map(
      (m) => m[1],
    );
    expect(links).toEqual([
      'https://example.org/journal/research/standard/',
      'https://example.org/journal/research/essay/',
    ]);
    expect(xml).not.toContain('in-review');
  });

  it('writes llms.txt and robots.txt', () => {
    expect(file('llms.txt')).toBe(`# Fixture

> A site for the integration tests.

## Articles

- [A standard article](https://example.org/journal/research/standard/): Uses a registered component without importing it.
- [A bespoke essay](https://example.org/journal/research/essay/): ${essayDescription()}
`);
    expect(file('robots.txt')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.org/journal/sitemap-index.xml\n',
    );
  });

  it('leaves articles in review, the component overview and files out of the sitemap', () => {
    const urls = [...file('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(urls).toContain('https://example.org/journal/');
    expect(urls).toContain('https://example.org/journal/research/standard/');
    expect(urls.some((url) => url?.includes('in-review'))).toBe(false);
    expect(urls.some((url) => url?.includes('components'))).toBe(false);
    expect(urls.some((url) => url?.endsWith('.xml') || url?.endsWith('.txt'))).toBe(false);
    // The article in review still has its page, for its reviewers.
    expect(page('research/in-review')).toContain('<meta name="robots" content="noindex"');
  });

  it('links the feed from every page', () => {
    expect(page('research/standard')).toContain(
      '<link rel="alternate" type="application/rss+xml" title="Fixture" href="/journal/rss.xml">',
    );
  });
});

function essayDescription(): string {
  const source = readFileSync(join(root, 'src/articles/essay/index.mdx'), 'utf8');
  return /^description: (.*)$/m.exec(source)?.[1]?.replace(/^"|"$/g, '') ?? '';
}
