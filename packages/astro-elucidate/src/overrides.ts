import { existsSync, realpathSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Vite gives module paths with forward slashes, also on Windows. */
const slash = (path: string) => path.replaceAll('\\', '/');
const real = (url: URL) => slash(realpathSync(fileURLToPath(url)));
const componentsDir = real(new URL('./components/', import.meta.url));
const engineDir = real(new URL('./', import.meta.url));

/** Checks that each override exists and returns their absolute paths, by component name. */
export function resolveOverrides(
  overrides: Record<string, string | undefined>,
  root: URL,
): Map<string, string> {
  const found = new Map<string, string>();
  for (const [name, path] of Object.entries(overrides)) {
    if (!path) continue;
    const file = fileURLToPath(new URL(path, root));
    if (!existsSync(file)) {
      throw new Error(
        `overrides.${name} points to ${path}, which does not exist.\n` +
          `  Fix: create ${path}, or remove ${name} from overrides in elucidate.config.ts.`,
      );
    }
    found.set(name, slash(realpathSync(file)));
  }
  return found;
}

/**
 * Replaces structural components with the site's overrides (docs/spec.md §11.5). Only imports
 * from inside the engine are redirected, so an override can still import and wrap the original
 * from `astro-elucidate/components/<Name>.astro`.
 */
export function overridesPlugin(overrides: Map<string, string>) {
  return {
    name: 'astro-elucidate:overrides',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined) {
      if (overrides.size === 0 || !importer || !source.endsWith('.astro')) return undefined;
      const from = slash(importer.split('?')[0] ?? importer);
      if (!from.startsWith(`${engineDir}/`) || !source.startsWith('.')) return undefined;
      const target = posix.resolve(posix.dirname(from), source);
      if (posix.dirname(target) !== componentsDir) return undefined;
      const name = target.slice(componentsDir.length + 1, -'.astro'.length);
      return overrides.get(name);
    },
  };
}
