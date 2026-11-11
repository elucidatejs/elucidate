import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { type PluggableList, unified } from 'unified';
import { VFile } from 'vfile';
import { builtInComponents } from '../markdown/auto-import.ts';
import { markdownPlugins } from '../markdown/index.ts';
import { resolveOverrides } from '../overrides.ts';
import { bespokeBlocks, readRegistry } from '../registry.ts';
import { articleSchema } from '../schema/article.ts';
import { formatIssues } from '../schema/helpers.ts';
import { type Context, loadSettings, script } from './site.ts';

type Plugins = ReturnType<typeof markdownPlugins>;

// MDX nodes that remark-rehype hands through untouched, as @mdx-js/mdx does.
const mdxNodes = [
  'mdxFlowExpression',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'mdxjsEsm',
];

/**
 * `elucidate check` (docs/spec.md §15): what a build would reject, without building. The site
 * settings, overrides and component registry; each article's front matter; then each article
 * through the Markdown pipeline, for references, citations and math. If all of that passes,
 * `astro check` checks the types.
 */
export async function check(context: Context): Promise<number> {
  const config = await loadSettings(context);
  const root = pathToFileURL(`${context.root}/`);
  const problems: string[] = [];
  let components: string[] = [];
  try {
    resolveOverrides(config.overrides, root);
    components = readRegistry(new URL('src/', root), [
      ...builtInComponents,
      ...bespokeBlocks,
    ]).names;
  } catch (error) {
    problems.push(message(error));
  }
  const plugins = markdownPlugins(config, join(context.root, 'src/pages'), components);
  const articles = articleFiles(context.root);
  for (const file of articles) {
    const problem = await checkArticle(file, context.root, plugins);
    if (problem) problems.push(problem);
  }
  if (problems.length > 0) {
    console.error(`${problems.join('\n\n')}\n`);
    console.error(`${problems.length} ${problems.length === 1 ? 'problem' : 'problems'} found.`);
    return 1;
  }
  console.log(
    `Settings and ${articles.length} ${articles.length === 1 ? 'article' : 'articles'} are fine. Checking types…`,
  );
  return astroCheck(context.root);
}

function articleFiles(root: string): string[] {
  const dir = join(root, 'src/articles');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .flatMap((slug) => ['mdx', 'md'].map((ext) => join(dir, slug, `index.${ext}`)))
    .filter((file) => existsSync(file));
}

/** The first problem in one article, in the build's fix-it format, or nothing. */
async function checkArticle(
  file: string,
  root: string,
  plugins: Plugins,
): Promise<string | undefined> {
  const shown = relative(root, file);
  let parsed: ReturnType<typeof parseFrontmatter>;
  try {
    // Blank out the front matter in place, so lines and columns match the file.
    parsed = parseFrontmatter(readFileSync(file, 'utf8'), { frontmatter: 'empty-with-spaces' });
  } catch (error) {
    return `${shown} → front matter\n  ${message(error)}`;
  }
  const valid = articleSchema.safeParse(parsed.frontmatter);
  if (!valid.success) return formatIssues(shown, valid.error.issues);

  const processor = unified().use(remarkParse);
  if (file.endsWith('.mdx')) processor.use(remarkMdx);
  processor.use([
    remarkGfm,
    ...plugins.remarkPlugins,
    [remarkRehype, { passThrough: mdxNodes }],
    ...plugins.rehypePlugins,
  ] as PluggableList);
  const vfile = new VFile({
    cwd: root,
    path: file,
    value: parsed.content,
    data: { astro: { frontmatter: parsed.frontmatter } },
  });
  try {
    await processor.run(processor.parse(vfile), vfile);
  } catch (error) {
    // Syntax errors from the MDX parser carry a position; the engine's own errors carry it in
    // their message already.
    const at = error as { line?: number; column?: number; reason?: string };
    return at.reason && at.line
      ? `${shown}:${at.line}:${at.column} → MDX\n  ${at.reason}`
      : message(error);
  }
  return undefined;
}

/** Runs `astro check` for the types; its output goes straight to the terminal. */
function astroCheck(root: string): number {
  const astro = createRequire(join(root, 'package.json')).resolve('astro/package.json');
  const bin = (JSON.parse(readFileSync(astro, 'utf8')) as { bin: { astro: string } }).bin.astro;
  const result = spawnSync(process.execPath, [join(dirname(astro), bin), 'check'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0)
    console.error(`\nFix the type errors above, then run ${script('check')} again.`);
  return result.status ?? 1;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
