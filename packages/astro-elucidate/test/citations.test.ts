import { expect, it } from 'vitest';
import { formatReference } from '../src/markdown/bibliography.ts';
import { render } from './markdown-helpers.ts';

it('numbers citations in order of first use and sorts numbers within a group', async () => {
  const { html, data } = await render(
    'First [@goh2017]. Then [@polyak1964; @goh2017]. Again [@polyak1964].',
  );
  expect(data.references.map((r) => [r.number, r.key])).toEqual([
    [1, 'goh2017'],
    [2, 'polyak1964'],
  ]);
  expect(html).toContain(
    '<span class="el-cite">[<a href="#ref-goh2017" class="el-cite__ref" aria-label="Reference 1">1</a>, <a href="#ref-polyak1964" class="el-cite__ref" aria-label="Reference 2">2</a>]</span>',
  );
  expect(html.match(/el-cite"/g)).toHaveLength(3);
});

it('formats references in the Distill style with links', async () => {
  const { data } = await render('[@polyak1964]');
  const [ref] = data.references;
  expect(ref?.doi).toBe('10.1016/0041-5553(64)90137-5');
  expect(ref?.url).toBe('https://doi.org/10.1016/0041-5553(64)90137-5');
  expect(ref?.html).toBe(
    '<a class="el-ref__title" href="https://doi.org/10.1016/0041-5553(64)90137-5">Some methods of speeding up the convergence of iteration methods</a><br>' +
      'Polyak, B.T., 1964. <i>USSR Computational Mathematics and Mathematical Physics, Vol 4(5), pp. 1-17</i>. ' +
      'DOI: <a href="https://doi.org/10.1016/0041-5553(64)90137-5">10.1016/0041-5553(64)90137-5</a>.',
  );
  expect(ref?.meta).toContain('citation_author=Boris T. Polyak; citation_publication_date=1964');
});

it('escapes HTML, decodes LaTeX accents and warns about entries without links', async () => {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (message: string) => warnings.push(message);
  try {
    const { data } = await render('[@nolink]');
    expect(data.references[0]?.html).toContain('A Book &amp; Its &lt;Title&gt;');
    expect(data.references[0]?.html).toContain('van der Berg, J. and Gödel, K., 2001');
    expect(warnings.join('\n')).toMatch(/@nolink\n {2}This reference has no url or doi/);
  } finally {
    console.warn = original;
  }
});

it('fails on unknown keys with the closest match', async () => {
  await expect(render('As shown [@goh2016].')).rejects.toThrow(
    /index\.md:1:\d+ → @goh2016\n {2}Unknown citation key\. Did you mean @goh2017\?/,
  );
});

it('asks for a bibliography when there is none, or more than one', async () => {
  await expect(render('[@x]', { folder: 'no-bib' })).rejects.toThrow(/No bibliography found/);
  await expect(render('[@a]', { folder: 'two-bibs' })).rejects.toThrow(
    /Found a\.bib, b\.bib.*\n.*set bibliography: a\.bib/s,
  );
  const { data } = await render('[@b]', {
    folder: 'two-bibs',
    frontmatter: { bibliography: 'b.bib' },
  });
  expect(data.references[0]?.key).toBe('b');
});

it('leaves bracketed text that is not a citation alone', async () => {
  const { html } = await render('An [aside] and an email@example.org.');
  expect(html).toContain('An [aside] and an');
  expect(html).not.toContain('el-cite');
});

it('formats entries without authors or venue', () => {
  expect(formatReference({ id: 'x', title: 'Only a title' }).html).toBe(
    '<span class="el-ref__title">Only a title</span>',
  );
});
