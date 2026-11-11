import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Blocks a `layout: bespoke` article composes its page from (docs/spec.md §9.4). */
export const bespokeBlocks = ['ArticleTitle', 'Byline', 'Abstract', 'TableOfContents', 'Appendix'];

export interface Registry {
  /** `src/components/index.ts`, when the site has one. */
  file?: string;
  /** The components it exports, in order. */
  names: string[];
}

/**
 * Reads the names exported by the site's component registry (docs/spec.md §11.4). The file is
 * read as text, not run, because the integration needs the names before Vite starts.
 */
export function readRegistry(srcDir: URL, reserved: string[]): Registry {
  const url = ['ts', 'js', 'mjs']
    .map((ext) => new URL(`components/index.${ext}`, srcDir))
    .find((candidate) => existsSync(candidate));
  if (!url) return { names: [] };
  const file = fileURLToPath(url);
  const shown = `src/components/${url.pathname.split('/').pop()}`;
  const names = exportNames(readFileSync(file, 'utf8'), shown);
  for (const name of names) {
    if (reserved.includes(name)) {
      throw new Error(
        `${shown} exports ${name}, which is the name of a built-in component.\n` +
          `  Fix: export it under another name, e.g. export { default as My${name} } from './${name}.astro';`,
      );
    }
  }
  return { file, names };
}

/** Export names of a module, from its source. Type-only exports are left out. */
export function exportNames(source: string, shown = 'src/components/index.ts'): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');
  const names: string[] = [];
  for (const match of code.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
    if (match[1]) continue;
    for (const part of (match[2] ?? '').split(',')) {
      const spec = part.trim();
      if (!spec || spec.startsWith('type ')) continue;
      const name = spec
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name && name !== 'default') names.push(name);
    }
  }
  const declaration =
    /export\s+(?:declare\s+)?(?:const|let|var|class|(?:async\s+)?function\*?)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of code.matchAll(declaration)) if (match[1]) names.push(match[1]);
  for (const match of code.matchAll(/export\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) {
    if (match[1]) names.push(match[1]);
  }
  if (/export\s+\*\s+from/.test(code)) {
    throw new Error(
      `${shown} uses export * from …, so its component names are unknown until it runs.\n` +
        `  Fix: name each component, e.g. export { default as Callout } from './Callout.astro';`,
    );
  }
  for (const name of names) {
    if (!/^[A-Z]/.test(name)) {
      throw new Error(
        `${shown} exports ${name}, but MDX treats tags that start with a lowercase letter as HTML.\n` +
          `  Fix: capitalize it, e.g. ${name[0]?.toUpperCase()}${name.slice(1)}.`,
      );
    }
  }
  return [...new Set(names)];
}
