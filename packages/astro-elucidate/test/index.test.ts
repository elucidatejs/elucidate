import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import elucidate from '../src/index.ts';

const config = { title: 'Lab Notes', url: 'https://example.github.io/lab-notes' };

/** Runs the integration's setup hook against a temporary project and records what it did. */
function setup(userConfig: Parameters<typeof elucidate>[0], pages: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), 'elucidate-'));
  mkdirSync(join(root, 'src/pages'), { recursive: true });
  for (const page of pages) writeFileSync(join(root, 'src/pages', page), '');
  const updates: Record<string, unknown>[] = [];
  const routes: string[] = [];
  const hook = elucidate(userConfig).hooks['astro:config:setup'];
  // biome-ignore lint/suspicious/noExplicitAny: a minimal stand-in for Astro's hook context.
  const context: any = {
    config: { srcDir: pathToFileURL(join(root, 'src/')), integrations: [] },
    updateConfig: (update: Record<string, unknown>) => updates.push(update),
    injectRoute: ({ pattern }: { pattern: string }) => routes.push(pattern),
  };
  hook?.(context);
  return { update: updates[0], routes };
}

describe('astro-elucidate integration', () => {
  it('sets site and base from the configured URL', () => {
    const { update } = setup(config);
    expect(update).toMatchObject({
      site: 'https://example.github.io/lab-notes',
      base: '/lab-notes',
    });
  });

  it('injects the index, article, tag and 404 routes', () => {
    expect(setup(config).routes).toEqual(['/', '/research/[slug]', '/research/tag/[tag]', '/404']);
  });

  it('moves the index under the articles route when home is a page', () => {
    const { routes } = setup({ ...config, home: 'page' }, ['index.mdx']);
    expect(routes[0]).toBe('/research');
  });

  it("does not replace the site's own 404 page", () => {
    expect(setup(config, ['404.astro']).routes).not.toContain('/404');
  });

  it('explains a homepage that conflicts with the article index', () => {
    expect(() => setup(config, ['index.astro'])).toThrow(
      "src/pages/index.astro conflicts with home: 'index'",
    );
  });

  it('explains a missing homepage', () => {
    expect(() => setup({ ...config, home: 'page' })).toThrow("home: 'page' needs a homepage");
  });

  it('reports invalid settings before doing anything else', () => {
    expect(() => setup({ ...config, url: 'example.com' })).toThrow('elucidate.config.ts → url');
  });
});
