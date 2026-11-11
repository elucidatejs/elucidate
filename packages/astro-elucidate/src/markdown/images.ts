import type { Root } from 'hast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { warn } from './shared.ts';

/**
 * Every image needs alt text (warning when it is empty) and loads lazily. Local images get their
 * intrinsic size from Astro's image pipeline, which runs after this plugin.
 */
export function rehypeImages() {
  return (tree: Root, file: VFile) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const alt = node.properties.alt;
      if (typeof alt !== 'string' || !alt.trim()) {
        warn(
          file,
          `image ${String(node.properties.src)}`,
          'Add alt text that describes the image: ![A contour plot with …](./figures/plot.png)',
        );
      }
      node.properties.loading ??= 'lazy';
      node.properties.decoding ??= 'async';
    });
  };
}
