// Builds a small site customized the ways docs/customizing.md describes, as a user would: a
// Byline override, a registered component of its own, and a bespoke article.
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
  execFileSync(process.execPath, [astro, 'build', '--outDir', outDir, '--silent'], {
    cwd: root,
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
