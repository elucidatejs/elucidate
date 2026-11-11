import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { expect, it } from 'vitest';
import { rehypeBaseLinks } from '../src/markdown/base-links.ts';

const html = (markdown: string, base: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeBaseLinks, { base })
      .use(rehypeStringify)
      .processSync(markdown),
  );

it('puts the base path in front of root links and images', () => {
  const out = html('[About](/about/) ![A dot.](/dot.png)', '/lab');
  expect(out).toContain('<a href="/lab/about/">');
  expect(out).toContain('<img src="/lab/dot.png"');
});

it('leaves other links alone', () => {
  const links = [
    '/lab/about/',
    '/lab',
    '//cdn.example.org/x.js',
    '#fig-1',
    'https://example.org/',
    'figures/x/',
  ];
  const out = html(links.map((href, i) => `[${i}](${href})`).join(' '), '/lab');
  for (const href of links) expect(out).toContain(`href="${href}"`);
});

it('does nothing without a base path', () => {
  expect(html('[About](/about/)', '/')).toContain('<a href="/about/">');
});
