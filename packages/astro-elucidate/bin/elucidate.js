#!/usr/bin/env node
// The `elucidate` command (docs/spec.md §15). The engine ships TypeScript, which Node does not run
// from node_modules, so this loads the CLI with the site's own Vite, as Astro loads its config.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = process.cwd();
let vite;
try {
  const fromSite = createRequire(join(root, 'package.json'));
  const fromAstro = createRequire(fromSite.resolve('astro/package.json'));
  vite = await import(pathToFileURL(fromAstro.resolve('vite')).href);
} catch {
  console.error(
    `elucidate: no Astro site in ${root}.\n  Fix: run the command in your site's folder, after npm install.`,
  );
  process.exit(1);
}

/** Imports a TypeScript module, such as the site's elucidate.config.ts. */
const load = async (file) =>
  (await vite.runnerImport(file, { root, configFile: false, logLevel: 'error' })).module;

const { run } = await load(fileURLToPath(new URL('../src/cli/index.ts', import.meta.url)));
process.exitCode = await run(process.argv.slice(2), { root, load });
