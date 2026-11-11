// Turns a copy of the starter into the reader's own site (docs/spec.md §15): its name, title and
// URL, and the published engine instead of the workspace one.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SiteOptions {
  /** Folder name, also the package name. */
  name: string;
  title: string;
  /** Full public URL, e.g. https://ada.github.io/notes. */
  url: string;
  /** Version range of astro-elucidate to depend on, e.g. ^0.1.0. */
  engine: string;
}

/** Lowercase ASCII with dashes, as the engine makes article slugs. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "my-journal" → "My Journal". */
export function titleFromName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

/** Until the reader gives one, the site's URL is a placeholder on GitHub Pages. */
export const placeholderUrl = (name: string) => `https://example.github.io/${slugify(name)}`;

/** The GitHub repository behind a GitHub Pages URL, if it is one (and not the placeholder). */
export function repositoryFor(url: string): string | undefined {
  const { hostname, pathname } = new URL(url);
  const owner = /^([a-z\d-]+)\.github\.io$/i.exec(hostname)?.[1];
  if (!owner || owner === 'example') return undefined;
  const repo = pathname.split('/').filter(Boolean)[0] ?? hostname;
  return `https://github.com/${owner}/${repo}`;
}

/** Whether `text` is a full http(s) URL, as `url` in elucidate.config.ts must be. */
export function isSiteUrl(text: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol);
  } catch {
    return false;
  }
}

/** Rewrites package.json and elucidate.config.ts of a fresh copy of the starter in `dir`. */
export function personalize(dir: string, site: SiteOptions): void {
  const pkgFile = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as {
    name: string;
    dependencies: Record<string, string>;
  };
  pkg.name = slugify(site.name) || 'elucidate-site';
  pkg.dependencies['astro-elucidate'] = site.engine;
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);

  const configFile = join(dir, 'elucidate.config.ts');
  const repository = repositoryFor(site.url);
  const edits: [RegExp, string][] = [
    [/^ {2}title: .*$/m, `  title: ${quote(site.title)},`],
    [/^ {2}url: .*$/m, `  url: ${quote(site.url)},`],
    [/^ {2}description: .*$/m, "  description: '',"],
    // The starter's own repository, with the comment above it.
    [
      /^(?: {2}\/\/.*\n)* {2}repository: .*\n/m,
      repository ? `  repository: ${quote(repository)},\n` : '',
    ],
  ];
  let config = readFileSync(configFile, 'utf8');
  for (const [pattern, replacement] of edits) {
    if (!pattern.test(config))
      throw new Error(`The starter's elucidate.config.ts has no ${pattern}.`);
    config = config.replace(pattern, () => replacement);
  }
  writeFileSync(configFile, config);
}

const quote = (text: string) => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
