import { describe, expect, it } from 'vitest';
import { parseConfig, siteAndBase } from '../src/config.ts';

const minimal = { title: 'Lab Notes', url: 'https://example.github.io/lab-notes' };

describe('parseConfig', () => {
  it('applies defaults to a minimal config', () => {
    const config = parseConfig(minimal);
    expect(config.home).toBe('index');
    expect(config.routes.articles).toBe('research');
    expect(config.math).toEqual({ engine: 'katex', macros: {} });
    expect(config.nav).toEqual([{ label: 'Research', href: '/' }]);
  });

  it('suggests the closest key for a typo', () => {
    expect(() => parseConfig({ ...minimal, titel: 'x' })).toThrow(
      'elucidate.config.ts\n  Unknown key "titel". Did you mean "title"?',
    );
  });

  it('suggests nested keys too', () => {
    expect(() => parseConfig({ ...minimal, math: { engin: 'katex' } })).toThrow(
      'elucidate.config.ts → math\n  Unknown key "engin". Did you mean "engine"?',
    );
  });

  it('explains a URL without protocol', () => {
    expect(() => parseConfig({ ...minimal, url: 'example.com' })).toThrow(
      'elucidate.config.ts → url\n  "example.com" is not a full URL.',
    );
  });

  it('names missing required fields', () => {
    expect(() => parseConfig({ url: minimal.url })).toThrow(
      'elucidate.config.ts → title\n  Required. Example: title: "Lab Notes"',
    );
  });
});

describe('siteAndBase', () => {
  it('derives the base path from the URL', () => {
    expect(siteAndBase('https://example.github.io/lab-notes/')).toEqual({
      site: 'https://example.github.io/lab-notes',
      base: '/lab-notes',
    });
  });

  it('uses / when the URL has no path', () => {
    expect(siteAndBase('https://journal.example.org')).toEqual({
      site: 'https://journal.example.org',
      base: '/',
    });
  });
});
