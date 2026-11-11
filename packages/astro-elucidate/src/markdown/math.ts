import type { Element, ElementContent, Parents, Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import type { Root as MdastRoot } from 'mdast';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { createRenderer, type Engine, type Render } from './math-engines.ts';
import { fail, pluginData } from './shared.ts';

interface Options {
  engine: Engine;
  /** TeX macros shared by both engines, e.g. `{ '\\R': '\\mathbb{R}' }`. */
  macros: Record<string, string>;
}

interface Found {
  node: Element;
  index: number;
  parent: Parents;
  display: boolean;
}

const textOf = (node: Element) =>
  node.children.map((child) => (child.type === 'text' ? child.value : '')).join('');

const isMath = (node: Element) =>
  Array.isArray(node.properties.className) && node.properties.className.includes('language-math');

/**
 * remark-math reads `$5 and $10` as math. Pandoc's rule tells prices from math: an opening `$`
 * is followed by a non-space, a closing `$` follows a non-space and is not followed by a digit.
 * Single-dollar math that breaks the rule goes back to plain text.
 */
export function remarkDollarSigns() {
  return (tree: MdastRoot, file: VFile) => {
    const source = String(file.value);
    visit(tree, 'inlineMath', (node, index, parent) => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (!parent || index === undefined || start === undefined || end === undefined) return;
      const raw = source.slice(start, end);
      if (raw.startsWith('$$')) return;
      if (/^\$\s|\s\$$/.test(raw) || /\d/.test(source[end] ?? '')) {
        parent.children[index] = { type: 'text', value: raw };
      }
    });
  };
}

/**
 * Renders the `$…$` and `$$…$$` that remark-math parsed, with KaTeX or MathJax, keeping MathML
 * for assistive technology. Display equations get a wrapper with the label as id, so
 * cross-references can link to them. Records `hasMath` so only pages with math load math CSS.
 */
export function rehypeMath({ engine, macros }: Options) {
  let renderer: Promise<Render> | undefined;
  return async (tree: Root, file: VFile) => {
    const found: Found[] = [];
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) return;
      const code = node.children[0];
      if (node.tagName === 'pre' && code?.type === 'element' && isMath(code)) {
        found.push({ node, index, parent, display: true });
        return SKIP;
      }
      if (node.tagName === 'code' && isMath(node))
        found.push({ node, index, parent, display: false });
    });
    if (found.length === 0) return;

    pluginData(file).hasMath = true;
    renderer ??= createRenderer(engine, macros);
    const render = await renderer;

    // Replace from the end so that earlier indexes stay valid.
    for (const { node, index, parent, display } of found.reverse()) {
      const tex = textOf(display ? (node.children[0] as Element) : node).trim();
      let html: string;
      try {
        html = await render(tex, display);
      } catch (error) {
        const source = display ? `$$ ${tex} $$` : `$${tex}$`;
        fail(
          file,
          node.position,
          source,
          `${(error as Error).message.replace(/^KaTeX parse error: /, '')}`,
        );
      }
      const children = fromHtml(html, { fragment: true }).children as ElementContent[];
      parent.children[index] = display
        ? {
            type: 'element',
            tagName: 'div',
            // Long equations scroll sideways on phones; tabindex lets keyboard users scroll
            // them too, like Astro's code blocks.
            properties: { className: ['el-equation'], id: node.properties.id, tabIndex: 0 },
            children,
          }
        : { type: 'element', tagName: 'span', properties: { className: ['el-math'] }, children };
    }
  };
}
