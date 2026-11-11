import type { ElementContent } from 'hast';
import type { Parent, Root, Text } from 'mdast';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { closest } from '../lib/suggest.ts';
import { findBibliography, formatReference, loadBibliography } from './bibliography.ts';
import { pointAt } from './crossref.ts';
import { fail, frontmatter, pluginData, warn } from './shared.ts';

// `[@key]` or `[@a; @b]`.
const GROUP = /\[(@[^\s;\],]+(?:\s*;\s*@[^\s;\],]+)*)\]/g;

interface Found {
  node: Text;
  index: number;
  parent: Parent;
  matches: RegExpExecArray[];
}

/**
 * Replaces `[@key]` and `[@a; @b]` with numbered citations, in order of first use, and exports
 * the cited entries of the article's BibTeX file as the bibliography (spec §6.3, §7.3).
 */
export function remarkCitations() {
  return (tree: Root, file: VFile) => {
    const found: Found[] = [];
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || parent.type === 'link') return;
      const matches = [...node.value.matchAll(GROUP)];
      if (matches.length > 0) found.push({ node, index, parent, matches });
    });
    if (found.length === 0) return;

    const first = found[0] as Found;
    const at = pointAt(first.node, first.matches[0]?.index ?? 0);
    let path: string | undefined;
    try {
      path = file.path ? findBibliography(file.path, frontmatter(file).bibliography) : undefined;
    } catch (error) {
      fail(file, at, 'bibliography', (error as Error).message);
    }
    if (!path) {
      fail(
        file,
        at,
        first.matches[0]?.[0] ?? 'citation',
        'No bibliography found. Add a .bib file next to the article, or set bibliography in the front matter.',
      );
    }
    const entries = loadBibliography(path);
    const order = new Map<string, number>();

    // Replace from the end so that earlier indexes stay valid.
    for (const { node, index, parent, matches } of found.reverse()) {
      const parts: Parent['children'] = [];
      let last = node.value.length;
      for (const match of [...matches].reverse()) {
        const end = match.index + match[0].length;
        if (end < last) parts.unshift({ type: 'text', value: node.value.slice(end, last) });
        const keys = (match[1] ?? '').split(';').map((k) => k.trim().slice(1));
        for (const key of keys) {
          if (entries.has(key)) continue;
          const hint = closest(key, entries.keys());
          fail(
            file,
            pointAt(node, match.index),
            `@${key}`,
            hint
              ? `Unknown citation key. Did you mean @${hint}?`
              : `Unknown citation key; it is not in ${path.split('/').at(-1)}.`,
          );
        }
        parts.unshift(citation(keys) as unknown as Text);
        last = match.index;
      }
      if (last > 0) parts.unshift({ type: 'text', value: node.value.slice(0, last) });
      parent.children.splice(index, 1, ...parts);
    }

    // Numbers follow the order of first use in the document; within a group they ascend.
    visit(tree, (node) => {
      if ((node.type as string) !== 'elucidateCitation') return;
      const data = node.data as unknown as { hChildren: ElementContent[] };
      const links = data.hChildren.filter((c) => c.type === 'element');
      for (const link of links) {
        const key = String(link.properties.dataKey);
        if (!order.has(key)) order.set(key, order.size + 1);
        link.properties.number = order.get(key);
      }
      links.sort((a, b) => Number(a.properties.number) - Number(b.properties.number));
      data.hChildren = [{ type: 'text', value: '[' }];
      for (const link of links) {
        if (data.hChildren.length > 1) data.hChildren.push({ type: 'text', value: ', ' });
        const number = String(link.properties.number);
        link.properties = { ...link.properties, ariaLabel: `Reference ${number}` };
        delete link.properties.dataKey;
        delete link.properties.number;
        link.children = [{ type: 'text', value: number }];
        data.hChildren.push(link);
      }
      data.hChildren.push({ type: 'text', value: ']' });
      return SKIP;
    });

    pluginData(file).references = [...order].map(([key, number]) => {
      const item = entries.get(key);
      if (item && !item.URL && !item.DOI) {
        warn(file, `@${key}`, 'This reference has no url or doi; readers cannot follow it.');
      }
      return { number, key, ...formatReference(item ?? { id: key }) };
    });
  };
}

/** A citation group; numbers, brackets and separators are filled in once all are known. */
function citation(keys: string[]) {
  const children: ElementContent[] = [];
  for (const key of new Set(keys)) {
    children.push({
      type: 'element',
      tagName: 'a',
      properties: { href: `#ref-${key}`, className: ['el-cite__ref'], dataKey: key },
      children: [],
    });
  }
  return {
    type: 'elucidateCitation',
    data: { hName: 'span', hProperties: { className: ['el-cite'] }, hChildren: children },
  };
}
