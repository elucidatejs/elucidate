import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { type ElucidateConfig, parseConfig } from '../config.ts';

export interface Context {
  /** The site's folder. */
  root: string;
  /** Imports a TypeScript module, such as the site's settings. */
  load: (file: string) => Promise<Record<string, unknown>>;
}

/** Reads and validates the site's elucidate.config.ts. */
export async function loadSettings({ root, load }: Context): Promise<ElucidateConfig> {
  const file = ['ts', 'mjs', 'js']
    .map((ext) => join(root, `elucidate.config.${ext}`))
    .find((candidate) => existsSync(candidate));
  if (!file) {
    throw new Error(
      `No elucidate.config.ts in ${root}.\n  Fix: run the command in your site's folder.`,
    );
  }
  return parseConfig((await load(file)).default);
}

/** How to run a package script with the package manager that ran this command. */
export function script(name: string): string {
  const agent = process.env.npm_config_user_agent?.split('/')[0] ?? 'npm';
  return agent === 'npm' ? `npm run ${name}` : `${agent} ${name}`;
}
