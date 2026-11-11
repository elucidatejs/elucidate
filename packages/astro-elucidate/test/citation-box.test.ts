import { expect, it } from 'vitest';
import { licenseInfo, repositoryLinks } from '../src/lib/appendix.ts';
import { bibtex, bibtexKey, citationText } from '../src/lib/citation.ts';
import { articleSchema } from '../src/schema/article.ts';

const article = (authors: string[], extra: Record<string, unknown> = {}) =>
  articleSchema.parse({
    title: 'The Building Blocks of Interpretability',
    description: 'x',
    date: '2018-03-06',
    authors: authors.map((name) => ({ name })),
    ...extra,
  });

const url = 'https://example.org/research/blocks/';

it('builds the BibTeX key from author, year and first significant title word', () => {
  expect(bibtexKey(article(['Chris Olah', 'Arvind Satyanarayan']))).toBe('olah2018building');
  expect(bibtexKey(article(['Kurt Gödel'], { title: 'On a Theorem' }))).toBe('godel2018theorem');
});

it('writes a Distill-style citation line', () => {
  expect(citationText(article(['Chris Olah']), 'Lab Notes', url)).toBe(
    `Olah, "The Building Blocks of Interpretability", Lab Notes, 2018. ${url}`,
  );
  expect(citationText(article(['Chris Olah', 'Shan Carter']), 'Lab Notes', url)).toMatch(
    /^Olah & Carter,/,
  );
  expect(
    citationText(
      article(['A B', 'C D', 'E F'], { doi: '10.23915/distill.00010' }),
      'Lab Notes',
      url,
    ),
  ).toBe(
    'B, et al., "The Building Blocks of Interpretability", Lab Notes, 2018. https://doi.org/10.23915/distill.00010',
  );
});

it('writes a BibTeX entry and escapes special characters', () => {
  expect(
    bibtex(article(['Chris Olah', 'Shan Carter'], { title: 'R&D at 100%' }), 'Lab Notes', url),
  ).toBe(
    [
      '@article{olah2018r,',
      '  author = {Chris Olah and Shan Carter},',
      '  title = {R\\&D at 100\\%},',
      '  journal = {Lab Notes},',
      '  year = {2018},',
      `  url = {${url}}`,
      '}',
    ].join('\n'),
  );
});

it('links the change history and a prefilled issue, also for sites in a subfolder', () => {
  expect(repositoryLinks('https://github.com/me/lab-notes', 'gnn', 'Graphs & more')).toEqual({
    history: 'https://github.com/me/lab-notes/commits/main/src/articles/gnn',
    issue: 'https://github.com/me/lab-notes/issues/new?title=Correction%3A%20Graphs%20%26%20more',
  });
  expect(repositoryLinks('https://github.com/org/repo/tree/trunk/site/', 'gnn', 'x').history).toBe(
    'https://github.com/org/repo/commits/trunk/site/src/articles/gnn',
  );
});

it('knows the common licenses and prints others as given', () => {
  expect(licenseInfo('CC-BY-4.0').url).toBe('https://creativecommons.org/licenses/by/4.0/');
  expect(licenseInfo('All rights reserved')).toEqual({ name: 'All rights reserved' });
});
