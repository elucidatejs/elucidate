import { expect, it } from 'vitest';
import { render, renderMdx } from './markdown-helpers.ts';

it('numbers labeled display equations and links references to them', async () => {
  const { html } = await render(
    [
      '$$',
      'a = b \\label{eq:first}',
      '$$',
      '',
      '$$',
      'c = d',
      '$$',
      '',
      '$$',
      'e = f \\label{eq:second}',
      '$$',
      '',
      'See @eq:second and @eq:first.',
    ].join('\n'),
  );
  expect(html).toContain('<div class="el-equation" id="eq:first" tabindex="0">');
  expect(html).toContain('<div class="el-equation" id="eq:second" tabindex="0">');
  expect(html).toContain('<div class="el-equation" tabindex="0">');
  expect(html).toContain('<a href="#eq:second" class="el-xref">Equation 2</a>');
  expect(html).toContain('<a href="#eq:first" class="el-xref">Equation 1</a>');
  expect(html).not.toContain('\\label');
});

it('links sections by slug, with the title when sections are not numbered', async () => {
  const { html, data } = await render('## Getting started\n\n### Details\n\nRead @sec:details.');
  expect(html).toContain('<h2 id="getting-started">Getting started</h2>');
  expect(html).toContain('<a href="#details" class="el-xref">Details</a>');
  expect(data.headings).toEqual([
    { depth: 2, slug: 'getting-started', text: 'Getting started' },
    { depth: 3, slug: 'details', text: 'Details' },
  ]);
});

it('numbers sections and subsections when enabled', async () => {
  const { html, data } = await render(
    '## One\n\n### One a\n\n## Two\n\n### Two a\n\nSee @sec:two-a.',
    {
      sections: true,
    },
  );
  expect(html).toContain('<h2 id="two" data-number="2">Two</h2>');
  expect(html).toContain('<a href="#two-a" class="el-xref">Section 2.1</a>');
  expect(data.headings.map((h) => h.number)).toEqual(['1', '1.1', '2', '2.1']);
});

it('leaves emails, URLs and trailing punctuation alone', async () => {
  const { html } = await render('$$\nx \\label{eq:x}\n$$\n\nMail me@eq:x, or see @eq:x.');
  expect(html).toContain('me@eq:x');
  expect(html).toContain('<a href="#eq:x" class="el-xref">Equation 1</a>.');
});

it('fails on an unknown label with the file, line and closest match', async () => {
  await expect(render('$$\nx \\label{eq:loss}\n$$\n\nAs @eq:los shows.')).rejects.toThrow(
    /fixtures\/article\/index\.md:5:\d+ → @eq:los\n {2}Unknown label\. Did you mean @eq:loss\?/,
  );
});

it('rejects equation labels without the eq: prefix and duplicate labels', async () => {
  await expect(render('$$\nx \\label{gd}\n$$')).rejects.toThrow(/start with eq:/);
  await expect(render('$$\nx \\label{eq:a}\n$$\n\n$$\ny \\label{eq:a}\n$$')).rejects.toThrow(
    /used twice/,
  );
});

it('numbers figures and tables separately and adds the number to the component', async () => {
  const { tree } = await renderMdx(
    [
      '<Figure id="fig:a" caption="A">',
      '  x',
      '</Figure>',
      '',
      '<Figure id="tbl:results" kind="table">',
      '  y',
      '</Figure>',
      '',
      '<Figure id="fig:b">',
      '  z',
      '</Figure>',
      '',
      '<Figure caption="Unnumbered">',
      '  w',
      '</Figure>',
      '',
      'See @fig:b, @tbl:results and @fig:a.',
    ].join('\n'),
  );
  const figures = tree.children.filter((n) => n.type === 'mdxJsxFlowElement') as unknown as {
    attributes: { name: string; value: string }[];
  }[];
  const attr = (i: number, name: string) =>
    figures[i]?.attributes.find((a) => a.name === name)?.value;
  expect([attr(0, 'number'), attr(1, 'number'), attr(2, 'number'), attr(3, 'number')]).toEqual([
    '1',
    '1',
    '2',
    undefined,
  ]);
  expect(attr(1, 'kind')).toBe('table');
  const text = JSON.stringify(tree.children.at(-1));
  expect(text).toContain('"url":"#fig:b"');
  expect(text).toContain('"value":"Figure 2"');
  expect(text).toContain('"value":"Table 1"');
});

it('explains figure ids that do not match their kind', async () => {
  await expect(renderMdx('<Figure id="fig:x" kind="table">x</Figure>')).rejects.toThrow(
    /A table id starts with tbl:, e\.g\. id="tbl:x"/,
  );
  await expect(renderMdx('<Figure id="landscape">x</Figure>')).rejects.toThrow(
    /start with fig: or tbl:/,
  );
});

it('lets the text refer to author-written appendix sections', async () => {
  const { tree } = await renderMdx(
    'See @sec:proofs.\n\n<AppendixSection title="A. Proofs" id="sec:proofs">p</AppendixSection>',
  );
  expect(JSON.stringify(tree)).toContain('"value":"A. Proofs"');
});

it('imports built-in components that an MDX file uses, unless it imports them itself', async () => {
  const { tree } = await renderMdx(
    '<Figure>x</Figure>\n\n<Acknowledgments>Thanks</Acknowledgments>',
  );
  const esm = tree.children[0] as unknown as { type: string; value: string };
  expect(esm.type).toBe('mdxjsEsm');
  expect(esm.value).toBe(
    "import { Figure, Acknowledgments } from 'astro-elucidate/components';".replaceAll("'", '"'),
  );

  const own = await renderMdx("import Figure from './MyFigure.astro'\n\n<Figure>x</Figure>");
  expect(own.tree.children.filter((n) => n.type === 'mdxjsEsm')).toHaveLength(1);
});
