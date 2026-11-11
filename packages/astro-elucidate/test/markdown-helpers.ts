import { fileURLToPath } from 'node:url';
import type { Root } from 'mdast';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { builtInComponents, remarkAutoImport } from '../src/markdown/auto-import.ts';
import { remarkCitations } from '../src/markdown/citations.ts';
import { remarkCrossref } from '../src/markdown/crossref.ts';
import { rehypeFootnotes } from '../src/markdown/footnotes.ts';
import { rehypeImages } from '../src/markdown/images.ts';
import { rehypeMath, remarkDollarSigns } from '../src/markdown/math.ts';
import type { Engine } from '../src/markdown/math-engines.ts';
import { remarkMdxBlocks } from '../src/markdown/mdx-blocks.ts';
import { remarkNumbering } from '../src/markdown/numbering.ts';
import { type PluginData, pluginData } from '../src/markdown/shared.ts';

export const fixture = (path: string) =>
  fileURLToPath(new URL(`./fixtures/${path}`, import.meta.url));

interface Options {
  /** Article folder under test/fixtures. */
  folder?: string;
  engine?: Engine;
  sections?: boolean;
  frontmatter?: Record<string, unknown>;
}

function file(value: string, { folder = 'article', frontmatter = {} }: Options) {
  return new VFile({
    value,
    path: fixture(`${folder}/index.md`),
    data: { astro: { frontmatter } },
  });
}

/** Runs the Markdown pipeline in the engine's order and returns the HTML and the plugin data. */
export async function render(markdown: string, options: Options = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDollarSigns)
    .use(remarkNumbering, { sections: options.sections ?? false })
    .use(remarkCrossref)
    .use(remarkCitations)
    .use(remarkRehype)
    .use(rehypeMath, {
      engine: options.engine ?? 'katex',
      macros: { '\\R': '\\mathbb{R}', '\\norm': '\\left\\lVert #1 \\right\\rVert' },
    })
    .use(rehypeFootnotes)
    .use(rehypeImages)
    .use(rehypeStringify);
  const vfile = file(markdown, options);
  const html = String(await processor.process(vfile));
  return { html, data: pluginData(vfile) as PluginData };
}

/** Runs the remark plugins on MDX and returns the tree, for JSX that HTML output cannot show. */
export async function renderMdx(mdx: string, options: Options = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMath)
    .use(remarkDollarSigns)
    .use(remarkMdxBlocks)
    .use(remarkNumbering, { sections: options.sections ?? false })
    .use(remarkCrossref)
    .use(remarkAutoImport, {
      sources: [{ from: 'astro-elucidate/components', names: builtInComponents }],
    });
  const vfile = file(mdx, options);
  const tree = (await processor.run(processor.parse(vfile), vfile)) as Root;
  return { tree, data: pluginData(vfile) };
}
