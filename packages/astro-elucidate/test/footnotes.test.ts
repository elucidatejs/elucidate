import { expect, it, vi } from 'vitest';
import { render } from './markdown-helpers.ts';

it('moves footnotes to the appendix data and places a sidenote after the first reference', async () => {
  const { html, data } = await render(
    'A claim.[^a] Another.[^b] Again.[^a]\n\n[^a]: First *note*.\n\n[^b]: Second note.',
  );
  expect(html).not.toContain('data-footnotes');
  expect(html).toContain(
    '<sup class="el-fnref"><a href="#fn-1" id="fnref-1" aria-label="Footnote 1" data-footnote-ref>1</a></sup>' +
      '<span class="el-sidenote" role="note"><span class="el-sidenote__number">1</span> <span>First <em>note</em>.</span></span>',
  );
  expect(html).toContain('id="fnref-1-2"');
  expect(html.match(/el-sidenote"/g)).toHaveLength(2);
  expect(data.footnotes).toEqual([
    { number: 1, html: expect.stringContaining('<p>First <em>note</em>.') },
    { number: 2, html: expect.stringContaining('<p>Second note.') },
  ]);
  expect(data.footnotes[0]?.html).not.toContain('backref');
});

it('keeps notes with block content out of the margin', async () => {
  const { html } = await render('Text.[^1]\n\n[^1]: A list:\n\n    - one\n    - two');
  expect(html).toContain('data-footnote-ref');
  expect(html).not.toContain('el-sidenote');
});

it('renders math inside footnotes before exporting them', async () => {
  const { data } = await render('Text.[^1]\n\n[^1]: With $x^2$.');
  expect(data.footnotes[0]?.html).toContain('class="katex"');
});

it('lazy-loads images and warns about missing alt text', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { html } = await render('![](./plot.png) ![A plot.](./other.png)');
  expect(html).toContain('<img src="./plot.png" alt="" loading="lazy" decoding="async">');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toMatch(/image \.\/plot\.png\n {2}Add alt text/);
  warn.mockRestore();
});
