import { afterEach, expect, it, vi } from 'vitest';
import { articlePath, slugify, tagPath, withBase } from '../src/lib/paths.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

it('prefixes internal paths with the base', () => {
  vi.stubEnv('BASE_URL', '/lab-notes');
  expect(withBase('/')).toBe('/lab-notes/');
  expect(withBase('/about/')).toBe('/lab-notes/about/');
  expect(articlePath('gnn')).toBe('/lab-notes/research/gnn/');
});

it('works without a base', () => {
  vi.stubEnv('BASE_URL', '/');
  expect(withBase('/about/')).toBe('/about/');
  expect(tagPath('Deep Learning')).toBe('/research/tag/deep-learning/');
});

it('leaves external links and fragments alone', () => {
  vi.stubEnv('BASE_URL', '/lab-notes');
  expect(withBase('https://example.org/x')).toBe('https://example.org/x');
  expect(withBase('#top')).toBe('#top');
});

it('slugifies tags for URLs', () => {
  expect(slugify('Réseaux de neurones')).toBe('reseaux-de-neurones');
});
