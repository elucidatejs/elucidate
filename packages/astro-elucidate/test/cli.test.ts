import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../src/cli/index.ts';
import { template } from '../src/cli/new.ts';
import { articleSchema } from '../src/schema/article.ts';

let root: string;
let output: string[];
const context = () => ({ root, load: (file: string) => import(file) });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'elucidate-cli-'));
  writeFileSync(
    join(root, 'elucidate.config.ts'),
    "export default { title: 'Lab Notes', url: 'https://ada.github.io/lab-notes' };\n",
  );
  output = [];
  const record = (...args: unknown[]) => void output.push(args.join(' '));
  vi.spyOn(console, 'log').mockImplementation(record);
  vi.spyOn(console, 'error').mockImplementation(record);
  vi.spyOn(console, 'warn').mockImplementation(record);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('elucidate new', () => {
  it('starts a draft from the template and prints where to preview it', async () => {
    expect(await run(['new', '--', 'Graphs, Gently'], context())).toBe(0);
    const source = readFileSync(join(root, 'src/articles/graphs-gently/index.mdx'), 'utf8');
    expect(source).toContain('title: "Graphs, Gently"');
    expect(source).toContain('status: draft');
    expect(output.join('\n')).toContain('http://localhost:4321/lab-notes/research/graphs-gently/');
  });

  it('writes front matter that passes the schema', () => {
    const { frontmatter } = parseFrontmatter(template('A "quoted" title', new Date(2026, 10, 11)));
    const data = articleSchema.parse(frontmatter);
    expect(data.title).toBe('A "quoted" title');
    expect(data.date.toISOString().slice(0, 10)).toBe('2026-11-11');
  });

  it('refuses a missing title and an existing folder', async () => {
    expect(await run(['new'], context())).toBe(1);
    expect(output.join('\n')).toContain('Give the article a title.');
    await run(['new', 'Graphs'], context());
    expect(await run(['new', 'Graphs'], context())).toBe(1);
    expect(output.join('\n')).toContain('src/articles/graphs/ already exists.');
  });
});

describe('elucidate check', () => {
  const article = (slug: string, text: string) => {
    mkdirSync(join(root, 'src/articles', slug), { recursive: true });
    writeFileSync(join(root, 'src/articles', slug, 'index.mdx'), text);
  };
  const frontmatter =
    '---\ntitle: T\ndescription: D\ndate: 2026-11-11\nauthors:\n  - name: A\n---\n';

  it('reports front matter, references and MDX syntax, each with its file', async () => {
    article('a', '---\ntitle: T\ndescription: D\ndate: 2026-11-11\n---\n');
    article('b', `${frontmatter}\nAs @fig:missing shows.\n`);
    article('c', `${frontmatter}\nText <Figure\n`);
    expect(await run(['check'], context())).toBe(1);
    const text = output.join('\n');
    // Paths are relative to the site, as the build shows them.
    expect(text).toMatch(/^src\/articles\/a\/index.mdx → authors\n {2}Required\./m);
    expect(text).toMatch(/^src\/articles\/b\/index.mdx:9:4 → @fig:missing$/m);
    expect(text).toMatch(/^src\/articles\/c\/index.mdx:9:13 → MDX$/m);
    expect(text).toContain('3 problems found.');
  });

  it('reports invalid settings', async () => {
    writeFileSync(
      join(root, 'elucidate.config.ts'),
      "export default { title: 'T', url: 'lab' };\n",
    );
    expect(await run(['check'], context())).toBe(1);
    expect(output.join('\n')).toContain('elucidate.config.ts → url');
  });
});

it('prints usage for an unknown command', async () => {
  expect(await run(['publish'], context())).toBe(1);
  expect(output.join('\n')).toContain('Unknown command "publish".');
});
