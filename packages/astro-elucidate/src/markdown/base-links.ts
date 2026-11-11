import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Markdown links and images with a root path, such as `[About](/about/)`, get the site's base path
 * (`/lab-notes/about/`), so the same text works wherever the site is published (docs/spec.md §5).
 * Paths that already start with the base are left alone.
 */
const attributes: Record<string, string | undefined> = { a: 'href', img: 'src' };

export function rehypeBaseLinks({ base }: { base: string }) {
  const prefix = base.replace(/\/+$/, '');
  const needsBase = (value: unknown): value is string =>
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    value !== prefix &&
    !value.startsWith(`${prefix}/`);
  return (tree: Root) => {
    if (!prefix) return;
    visit(tree, 'element', (node) => {
      const key = attributes[node.tagName];
      const value = key && node.properties[key];
      if (key && needsBase(value)) node.properties[key] = `${prefix}${value}`;
    });
  };
}
