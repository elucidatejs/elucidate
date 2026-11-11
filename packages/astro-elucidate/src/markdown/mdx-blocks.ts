import type { Root } from 'mdast';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

/** Built-in components that render a block, not a phrase. */
export const blockComponents = [
  'Figure',
  'Block',
  'Aside',
  'Note',
  'Overlay',
  'Acknowledgments',
  'Contributions',
  'AppendixSection',
  'ArticleList',
];

/**
 * MDX parses a one-line `<Aside>A short note.</Aside>` as a paragraph holding an inline element,
 * which would put a block inside `<p>`; browsers then split the paragraph around it. When such an
 * element is all the paragraph holds, it takes the paragraph's place.
 */
export function remarkMdxBlocks({ names = blockComponents }: { names?: string[] } = {}) {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Parent, index, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;
      const content = node.children.filter(
        (child) => !(child.type === 'text' && !(child as { value?: string }).value?.trim()),
      );
      const only = content[0] as (Node & { name?: string | null }) | undefined;
      if (content.length !== 1 || only?.type !== 'mdxJsxTextElement') return;
      if (!only.name || !names.includes(only.name)) return;
      parent.children[index] = { ...only, type: 'mdxJsxFlowElement' };
    });
  };
}
