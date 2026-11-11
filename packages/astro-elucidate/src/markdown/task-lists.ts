import type { Element, ElementContent, Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

/**
 * GFM task list items (`- [x] Done`) start with a disabled checkbox that has no name, so screen
 * readers announce an unlabeled control (axe: `label`). The checkbox and the text after it, up to
 * the first block such as a nested list, move into a `<label>`.
 */
const blocks = new Set(['ul', 'ol', 'p', 'div', 'pre', 'blockquote', 'table', 'figure']);

const isTaskCheckbox = (node: ElementContent): node is Element =>
  node.type === 'element' &&
  node.tagName === 'input' &&
  node.properties.type === 'checkbox' &&
  Boolean(node.properties.disabled);

const isBlock = (node: ElementContent) => node.type === 'element' && blocks.has(node.tagName);

export function rehypeTaskLists() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'label') return SKIP;
      const start = node.children.findIndex(isTaskCheckbox);
      if (start === -1) return;
      let end = start + 1;
      while (end < node.children.length && !isBlock(node.children[end] as ElementContent)) end++;
      const label: Element = {
        type: 'element',
        tagName: 'label',
        properties: {},
        children: node.children.slice(start, end),
      };
      node.children.splice(start, end - start, label);
    });
  };
}
