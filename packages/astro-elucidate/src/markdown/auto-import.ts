import type { Root } from 'mdast';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

/** Authoring components available in every MDX file without an import (spec §9.1). */
export const builtInComponents = [
  'Acknowledgments',
  'AppendixSection',
  'ArticleList',
  'Aside',
  'Block',
  'Button',
  'Contributions',
  'Figure',
  'Note',
  'Overlay',
];

interface EsmNode extends Node {
  type: 'mdxjsEsm';
  data?: { estree?: { body?: { type: string; specifiers?: { local: { name: string } }[] }[] } };
}

export interface ImportSource {
  /** Module to import from. */
  from: string;
  /** Components it provides. */
  names: string[];
}

/**
 * Adds `import { Figure, … } from 'astro-elucidate/components'` (and the same for the site's own
 * components) to MDX files that use them and do not import or define them themselves. A few lines
 * instead of `astro-auto-import`.
 */
export function remarkAutoImport({ sources }: { sources: ImportSource[] }) {
  const known = new Set(sources.flatMap((source) => source.names));
  return (tree: Root) => {
    const used = new Set<string>();
    visit(tree, (node: Node) => {
      const name = (node as { name?: string }).name;
      const jsx = node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
      if (jsx && name && known.has(name)) used.add(name);
    });
    for (const node of tree.children as Node[]) {
      if (node.type !== 'mdxjsEsm') continue;
      for (const statement of (node as EsmNode).data?.estree?.body ?? []) {
        for (const specifier of statement.specifiers ?? []) used.delete(specifier.local.name);
      }
    }
    const imports = sources
      .map((source) => ({ from: source.from, names: source.names.filter((n) => used.has(n)) }))
      .filter((source) => source.names.length > 0);
    (tree.children as Node[]).unshift(...imports.map(({ from, names }) => esmImport(from, names)));
  };
}

function esmImport(source: string, names: string[]): Node {
  return {
    type: 'mdxjsEsm',
    value: `import { ${names.join(', ')} } from ${JSON.stringify(source)};`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: names.map((name) => ({
              type: 'ImportSpecifier',
              imported: { type: 'Identifier', name },
              local: { type: 'Identifier', name },
            })),
            source: { type: 'Literal', value: source, raw: JSON.stringify(source) },
          },
        ],
      },
    },
  } as Node;
}
