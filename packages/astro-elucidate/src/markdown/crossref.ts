import type { PhrasingContent, Root, Text } from 'mdast';
import type { Point } from 'unist';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { closest } from '../lib/suggest.ts';
import { fail, type Label, labels } from './shared.ts';

// `@kind:label`, not inside an email address or a URL path; labels end in a letter or digit so
// that trailing punctuation stays text.
const REFERENCE = /(^|[^\w@/])@(fig|tbl|eq|sec):([A-Za-z0-9](?:[\w.:-]*[A-Za-z0-9])?)/g;
const NAMES = { figure: 'Figure', table: 'Table', equation: 'Equation', section: 'Section' };

/** Link text: "Figure 2", "Equation 3", "Section 4", or the title of an unnumbered section. */
export function referenceText(label: Label): string {
  if (label.kind === 'section' && !label.number) return label.title ?? label.id;
  return `${NAMES[label.kind]} ${label.number}`;
}

/** Replaces `@fig:…`, `@tbl:…`, `@eq:…` and `@sec:…` with links to the numbered target. */
export function remarkCrossref() {
  return (tree: Root, file: VFile) => {
    const known = labels(file);
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || parent.type === 'link') return;
      const matches = [...node.value.matchAll(REFERENCE)];
      if (matches.length === 0) return;

      const parts: PhrasingContent[] = [];
      let last = 0;
      for (const match of matches) {
        const start = match.index + (match[1]?.length ?? 0);
        const id = `${match[2]}:${match[3]}`;
        const label = known.get(id);
        if (!label) {
          const hint = closest(id, known.keys());
          fail(
            file,
            pointAt(node, start),
            `@${id}`,
            hint
              ? `Unknown label. Did you mean @${hint}?`
              : 'Unknown label. Give a Figure an id, an equation a \\label{…}, or check the section slug.',
          );
        }
        if (start > last) parts.push({ type: 'text', value: node.value.slice(last, start) });
        parts.push({
          type: 'link',
          url: `#${label.id}`,
          children: [{ type: 'text', value: referenceText(label) }],
          data: { hProperties: { className: ['el-xref'] } },
        });
        last = start + id.length + 1;
      }
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}

/** The source position of a character inside a text node (approximate if it had escapes). */
export function pointAt(node: Text, offset: number): Point | undefined {
  const start = node.position?.start;
  if (!start) return undefined;
  const before = node.value.slice(0, offset).split('\n');
  return before.length === 1
    ? { line: start.line, column: start.column + offset }
    : { line: start.line + before.length - 1, column: (before.at(-1)?.length ?? 0) + 1 };
}
