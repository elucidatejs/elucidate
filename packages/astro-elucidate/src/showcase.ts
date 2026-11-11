import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** One line for each built-in on the component overview page (docs/spec.md §10.5). */
const descriptions: Record<string, string> = {
  Figure:
    'A figure or table with a number, a caption, a description for screen readers and an image for print.',
  Block: 'Puts any content at a wider width: wide, page or screen.',
  Aside: 'A note in the right margin on wide screens, inline on narrow ones. Not numbered.',
  Note: 'A callout in the text column, set off by a hairline.',
  Button: 'A pill for actions that change the page, such as opening an overlay.',
  Overlay: 'A modal dialog, drawer or full-window view, linked by the URL hash.',
  Acknowledgments: 'The first section of the appendix.',
  Contributions: 'Who did what; the second section of the appendix.',
  AppendixSection: 'Supplementary sections, after the author contributions.',
  ArticleList:
    'The rows of the article index, newest first, anywhere: on a homepage of your own, say.',
  Controls:
    'Not a component: the classes el-slider, el-segmented and el-toggle style the controls of interactive figures.',
};

const examplesDir = new URL('./components/examples/', import.meta.url);
const slash = (path: string) => path.replaceAll('\\', '/');

/** The source of an example as an author would write it: without the import block. */
function exampleSource(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

/**
 * Code for `virtual:elucidate/showcase`: the built-in examples, then the site's registered
 * components with their `<Name>.example.mdx` files where they exist.
 */
export function showcaseModule(userNames: string[], srcDir: URL): string {
  const lines: string[] = [];
  const builtIn: string[] = [];
  Object.keys(descriptions).forEach((name, i) => {
    const file = new URL(`${name}.example.astro`, examplesDir);
    lines.push(`import B${i} from ${JSON.stringify(slash(fileURLToPath(file)))};`);
    const source = exampleSource(readFileSync(file, 'utf8'));
    builtIn.push(
      `{ name: ${JSON.stringify(name)}, description: ${JSON.stringify(descriptions[name])}, Example: B${i}, source: ${JSON.stringify(source)} }`,
    );
  });
  const componentsDir = new URL('components/', srcDir);
  const files = existsSync(componentsDir) ? readdirSync(componentsDir) : [];
  const user = userNames.map((name, i) => {
    const file = `${name}.example.mdx`;
    if (!files.includes(file)) return `{ name: ${JSON.stringify(name)} }`;
    const url = new URL(file, componentsDir);
    lines.push(`import U${i} from ${JSON.stringify(slash(fileURLToPath(url)))};`);
    const source = readFileSync(url, 'utf8').trim();
    return `{ name: ${JSON.stringify(name)}, Example: U${i}, source: ${JSON.stringify(source)} }`;
  });
  lines.push(`export const builtIn = [${builtIn.join(',\n')}];`);
  lines.push(`export const user = [${user.join(',\n')}];`);
  return lines.join('\n');
}
