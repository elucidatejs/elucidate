import type { Element, ElementContent, Root } from 'hast';
import { toHtml } from 'hast-util-to-html';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { pluginData } from './shared.ts';

interface Note {
  number: number;
  content: ElementContent[];
  referenced: boolean;
}

const isElement = (node: unknown): node is Element =>
  (node as Element | undefined)?.type === 'element';

/**
 * Turns GFM footnotes into sidenotes: the footnote list moves to the appendix (exported as
 * `footnotes`), each first reference in a paragraph gets the note beside it in the right margin,
 * and ids become `fn-1` / `fnref-1`.
 */
export function rehypeFootnotes() {
  return (tree: Root, file: VFile) => {
    const notes = extractNotes(tree);
    if (notes.size === 0) return;

    visit(tree, 'element', (sup, index, parent) => {
      const link = sup.children.find(isElement);
      if (sup.tagName !== 'sup' || !link || !('dataFootnoteRef' in link.properties)) return;
      const note = notes.get(String(link.properties.href).slice(1));
      if (!note || !parent || index === undefined) return SKIP;
      const n = note.number;
      sup.properties = { className: ['el-fnref'] };
      link.properties = {
        href: `#fn-${n}`,
        id: note.referenced
          ? `fnref-${n}-${String(link.properties.id).split('-').at(-1)}`
          : `fnref-${n}`,
        ariaLabel: `Footnote ${n}`,
        dataFootnoteRef: true,
      };
      link.children = [{ type: 'text', value: String(n) }];
      const first = !note.referenced;
      note.referenced = true;
      if (!first || !isElement(parent) || parent.tagName !== 'p') return SKIP;
      const sidenote = inline(note.content);
      if (!sidenote) return SKIP;
      parent.children.splice(index + 1, 0, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['el-sidenote'], role: 'note' },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['el-sidenote__number'] },
            children: [{ type: 'text', value: String(n) }],
          },
          { type: 'text', value: ' ' },
          ...sidenote,
        ],
      });
      return [SKIP, index + 2];
    });

    pluginData(file).footnotes = [...notes.values()].map(({ number, content }) => ({
      number,
      html: toHtml(content),
    }));
  };
}

/** Removes the GFM footnote section and returns its notes by their old id, numbered in order. */
function extractNotes(tree: Root): Map<string, Note> {
  const notes = new Map<string, Note>();
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'section' || !('dataFootnotes' in node.properties)) return;
    const list = node.children.find((c) => isElement(c) && c.tagName === 'ol') as
      | Element
      | undefined;
    for (const item of list?.children.filter(isElement) ?? []) {
      notes.set(String(item.properties.id), {
        number: notes.size + 1,
        content: withoutBackrefs(item.children),
        referenced: false,
      });
    }
    if (parent && index !== undefined) parent.children.splice(index, 1);
    return [SKIP, index];
  });
  return notes;
}

/** Drops the ↩ links GFM adds, and the space that was left before them. */
function withoutBackrefs(nodes: ElementContent[]): ElementContent[] {
  const kept = nodes
    .filter((n) => !(isElement(n) && 'dataFootnoteBackref' in n.properties))
    .map((n) => (isElement(n) ? { ...n, children: withoutBackrefs(n.children) } : n));
  if (kept.length === nodes.length) return kept;
  for (let last = kept.at(-1); last?.type === 'text'; last = kept.at(-1)) {
    const value = last.value.trimEnd();
    if (value) {
      kept[kept.length - 1] = { ...last, value };
      break;
    }
    kept.pop();
  }
  return kept;
}

/** The note as inline content (paragraphs become spans), or undefined if it has other blocks. */
function inline(content: ElementContent[]): ElementContent[] | undefined {
  const blocks = content.filter((n) => !(n.type === 'text' && !n.value.trim()));
  if (!blocks.every((n) => isElement(n) && n.tagName === 'p')) return undefined;
  return blocks.flatMap((p, i) => [
    ...(i > 0 ? [{ type: 'text' as const, value: ' ' }] : []),
    { ...(p as Element), tagName: 'span' },
  ]);
}
