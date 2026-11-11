import Slugger from 'github-slugger';
import type { Root } from 'mdast';
import { toString as textOf } from 'mdast-util-to-string';
import type { Node, Position } from 'unist';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { fail, labels, pluginData, warn } from './shared.ts';

interface Options {
  /** `numbering.sections` from the site settings. */
  sections: boolean;
}

/** The parts of an MDX JSX element this plugin reads and writes. */
export interface JsxElement extends Node {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name: string | null;
  attributes: { type: string; name?: string; value?: unknown }[];
}

interface MathNode extends Node {
  type: 'math';
  value: string;
  data?: { hName?: string; hProperties?: Record<string, unknown>; hChildren?: unknown[] };
}

interface HeadingNode extends Node {
  type: 'heading';
  depth: number;
  data?: { hProperties?: Record<string, unknown> };
}

const LABEL = /\\label\{([^}]*)\}/g;

/** Reads a string attribute of an MDX JSX element; `true` for a bare attribute. */
export function attribute(node: JsxElement, name: string): string | true | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
  if (!attr) return undefined;
  if (attr.value === null || attr.value === undefined) return true;
  return typeof attr.value === 'string' ? attr.value : undefined;
}

function setAttribute(node: JsxElement, name: string, value: string): void {
  node.attributes = node.attributes.filter((a) => a.name !== name);
  node.attributes.push({ type: 'mdxJsxAttribute', name, value });
}

/**
 * Numbers sections (when enabled), figures and tables by kind, and labeled display equations, in
 * document order. Collects the labels for cross-references and the headings for the contents.
 */
export function remarkNumbering({ sections }: Options) {
  return (tree: Root, file: VFile) => {
    const data = pluginData(file);
    const known = labels(file);
    const slugger = new Slugger();
    const count = { figure: 0, table: 0, equation: 0, section: 0, subsection: 0 };

    const register = (id: string, label: Parameters<typeof known.set>[1], at?: Position) => {
      if (known.has(id)) fail(file, at, id, 'This label is used twice. Labels must be unique.');
      known.set(id, label);
    };

    visit(tree, (node: Node) => {
      if (node.type === 'heading') {
        const heading = node as HeadingNode;
        const text = textOf(heading);
        const slug = slugger.slug(text);
        const properties: Record<string, unknown> = { ...heading.data?.hProperties, id: slug };
        let number: string | undefined;
        if (heading.depth === 1) {
          warn(file, `# ${text}`, 'The title comes from the front matter. Use ## for sections.');
        } else if (sections && heading.depth === 2) {
          number = String(++count.section);
          count.subsection = 0;
        } else if (sections && heading.depth === 3) {
          number = `${count.section}.${++count.subsection}`;
        }
        if (number) properties.dataNumber = number;
        heading.data = { ...heading.data, hProperties: properties };
        if (heading.depth === 2 || heading.depth === 3) {
          data.headings.push({ depth: heading.depth, slug, text, ...(number && { number }) });
        }
        register(`sec:${slug}`, { kind: 'section', id: slug, number, title: text }, node.position);
        return;
      }

      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const element = node as JsxElement;
        if (element.name === 'Figure') numberFigure(element);
        if (element.name === 'AppendixSection') {
          const id = attribute(element, 'id');
          const title = attribute(element, 'title');
          if (typeof id === 'string') {
            if (!id.startsWith('sec:')) {
              fail(
                file,
                node.position,
                `id="${id}"`,
                'Section ids start with sec:, e.g. id="sec:derivations".',
              );
            }
            register(
              id,
              { kind: 'section', id, title: typeof title === 'string' ? title : id },
              node.position,
            );
          }
        }
        return;
      }

      if (node.type === 'math') numberEquation(node as MathNode);
    });

    function numberFigure(node: JsxElement) {
      const id = attribute(node, 'id');
      if (id === undefined) return;
      if (typeof id !== 'string' || !/^(fig|tbl):./.test(id)) {
        fail(
          file,
          node.position,
          'Figure id',
          'Figure ids are plain strings that start with fig: or tbl:, e.g. id="fig:landscape".',
        );
      }
      const prefix = id.startsWith('tbl:') ? 'table' : 'figure';
      const kind = attribute(node, 'kind') ?? prefix;
      if (kind !== 'figure' && kind !== 'table') {
        fail(file, node.position, `kind="${kind}"`, 'Expected kind="figure" or kind="table".');
      }
      if (kind !== prefix) {
        const expected = kind === 'table' ? 'tbl:' : 'fig:';
        fail(
          file,
          node.position,
          `id="${id}"`,
          `A ${kind} id starts with ${expected}, e.g. id="${expected}${id.slice(4)}".`,
        );
      }
      const number = String(++count[kind]);
      setAttribute(node, 'kind', kind);
      setAttribute(node, 'number', number);
      register(id, { kind, id, number }, node.position);
    }

    function numberEquation(node: MathNode) {
      const found = [...node.value.matchAll(LABEL)];
      if (found.length === 0) return;
      const id = found[0]?.[1] ?? '';
      if (found.length > 1) {
        fail(file, node.position, `\\label{${id}}`, 'Use one \\label per display equation.');
      }
      if (!id.startsWith('eq:')) {
        fail(
          file,
          node.position,
          `\\label{${id}}`,
          'Equation labels start with eq:, e.g. \\label{eq:gd}.',
        );
      }
      const number = String(++count.equation);
      node.value = `${node.value.replace(LABEL, '').trimEnd()} \\tag{${number}}`;
      // remark-math stores the hast output on the node, so it is rebuilt with the new source.
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, id },
        hChildren: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: ['language-math', 'math-display'] },
            children: [{ type: 'text', value: node.value }],
          },
        ],
      };
      register(id, { kind: 'equation', id, number }, node.position);
    }
  };
}
