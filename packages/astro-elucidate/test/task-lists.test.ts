import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { expect, it } from 'vitest';
import { rehypeTaskLists } from '../src/markdown/task-lists.ts';

const html = (markdown: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeTaskLists)
      .use(rehypeStringify)
      .processSync(markdown),
  );

it('labels each task checkbox with its text', () => {
  const out = html('- [x] Write the *first* draft\n- [ ] Ask a colleague');
  expect(out).toContain(
    '<label><input type="checkbox" checked disabled> Write the <em>first</em> draft</label>',
  );
  expect(out).toContain('<label><input type="checkbox" disabled> Ask a colleague</label>');
});

it('keeps a nested list and a loose item’s paragraphs outside the label', () => {
  expect(html('- [ ] Outline\n  - Sections')).toMatch(
    /<label><input type="checkbox" disabled> Outline\s*<\/label><ul>/,
  );
  const out = html('- [x] Draft\n\n  More text.\n- [ ] Review');
  expect(out).toContain('<p><label><input type="checkbox" checked disabled> Draft</label></p>');
  expect(out).toContain('<p>More text.</p>');
});
