import type { Root } from 'mdast';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

/** Authoring components available in every MDX file without an import (spec §9.1). */
export const builtInComponents = ['Figure', 'Acknowledgments', 'Contributions', 'AppendixSection'];

interface EsmNode extends Node {
  type: 'mdxjsEsm';
  data?: { estree?: { body?: { type: string; specifiers?: { local: { name: string } }[] }[] } };
}

/**
 * Adds `import { Figure, … } from 'astro-elucidate/components'` to MDX files that use built-in
 * components and do not define them themselves. A few lines instead of `astro-auto-import`.
 */
export function remarkAutoImport({ source }: { source: string }) {
  return (tree: Root) => {
    const used = new Set<string>();
    visit(tree, (node: Node) => {
      const name = (node as { name?: string }).name;
      const jsx = node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
      if (jsx && name && builtInComponents.includes(name)) used.add(name);
    });
    for (const node of tree.children as Node[]) {
      if (node.type !== 'mdxjsEsm') continue;
      for (const statement of (node as EsmNode).data?.estree?.body ?? []) {
        for (const specifier of statement.specifiers ?? []) used.delete(specifier.local.name);
      }
    }
    if (used.size === 0) return;
    const names = [...used];
    const esm = {
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
    };
    (tree.children as Node[]).unshift(esm);
  };
}
