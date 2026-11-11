import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { builtArticles, listedArticles, listedTags } from '../src/lib/articles.ts';
import { setEntries } from './stubs/astro-content.ts';

const entry = (id: string, status: string, date: string, tags: string[] = []) => ({
  id,
  data: { status, date: new Date(date), tags },
});

beforeEach(() => {
  setEntries([
    entry('old', 'published', '2025-01-01', ['graphs']),
    entry('new', 'published', '2026-06-01', ['optimization']),
    entry('wip', 'draft', '2026-07-01', ['drafts']),
    entry('peer', 'review', '2026-08-01', ['review-only']),
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('status handling (docs/spec.md §7.2)', () => {
  it('lists only published articles, newest first', async () => {
    expect((await listedArticles()).map((a) => a.id)).toEqual(['new', 'old']);
  });

  it('filters the list by tag', async () => {
    expect((await listedArticles('graphs')).map((a) => a.id)).toEqual(['old']);
  });

  it('builds review articles but not drafts in production', async () => {
    vi.stubEnv('DEV', false);
    expect((await builtArticles()).map((a) => a.id)).toEqual(['old', 'new', 'peer']);
  });

  it('builds drafts on the dev server', async () => {
    vi.stubEnv('DEV', true);
    expect((await builtArticles()).map((a) => a.id)).toContain('wip');
  });

  it('collects tags from listed articles only', async () => {
    expect(await listedTags()).toEqual(['graphs', 'optimization']);
  });
});
