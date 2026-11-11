import { describe, expect, it } from 'vitest';
import { articleSchema } from '../src/schema/article.ts';
import { formatIssues } from '../src/schema/helpers.ts';

const valid = {
  title: 'Understanding Convolutions on Graphs',
  description: 'The building blocks of GNNs.',
  date: '2026-11-10',
  authors: [{ name: 'Ada Lovelace', affiliations: ['cam'] }],
  affiliations: { cam: { name: 'University of Cambridge' } },
};

function errors(data: unknown): string {
  const result = articleSchema.safeParse(data);
  if (result.success) return '';
  return formatIssues('src/articles/gnn/index.mdx', result.error.issues);
}

describe('article front matter', () => {
  it('accepts a minimal article and applies defaults', () => {
    const data = articleSchema.parse(valid);
    expect(data.status).toBe('draft');
    expect(data.toc).toBe(true);
    expect(data.hero).toEqual({ width: 'page', position: 'below' });
    expect(data.date).toBeInstanceOf(Date);
  });

  it('explains an invalid ORCID with the expected form', () => {
    const authors = [{ name: 'Ada Lovelace', orcid: '1234' }];
    expect(errors({ ...valid, authors })).toBe(
      'src/articles/gnn/index.mdx → authors[0].orcid\n' +
        '  "1234" is not a valid ORCID. Expected 0000-0000-0000-0000 (last character may be X).',
    );
  });

  it('accepts an ORCID ending in X', () => {
    const authors = [{ name: 'Ada Lovelace', orcid: '0000-0002-1694-233X' }];
    expect(errors({ ...valid, authors })).toBe('');
  });

  it('suggests a known affiliation key', () => {
    const authors = [{ name: 'Ada Lovelace', affiliations: ['camb'] }];
    expect(errors({ ...valid, authors })).toContain(
      'Unknown affiliation "camb". Did you mean "cam"?',
    );
  });

  it('suggests the closest field for a typo', () => {
    expect(errors({ ...valid, autors: [] })).toContain(
      'Unknown key "autors". Did you mean "authors"?',
    );
  });

  it('requires at least one author', () => {
    expect(errors({ ...valid, authors: [] })).toContain('Add at least one author');
  });

  it('rejects a DOI URL and shows the bare form', () => {
    expect(errors({ ...valid, doi: 'https://doi.org/10.1/x' })).toContain(
      'Expected the bare DOI, e.g. 10.5281/zenodo.1234567',
    );
  });
});
