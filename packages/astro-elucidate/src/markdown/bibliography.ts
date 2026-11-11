import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { plugins } from '@citation-js/core';
import '@citation-js/plugin-bibtex';

/** The CSL-JSON fields the bibliography uses. */
export interface CslItem {
  id: string;
  type?: string;
  title?: string;
  author?: CslName[];
  editor?: CslName[];
  issued?: { 'date-parts'?: (number | string)[][]; literal?: string };
  'container-title'?: string;
  publisher?: string;
  volume?: string | number;
  issue?: string | number;
  page?: string;
  DOI?: string;
  URL?: string;
}

interface CslName {
  family?: string;
  given?: string;
  literal?: string;
  'non-dropping-particle'?: string;
}

/**
 * Finds the article's BibTeX file: `bibliography` from the front matter, else the single `.bib`
 * file next to it (spec §7.3). Throws a fix-it error when the choice is ambiguous or missing.
 */
export function findBibliography(articleFile: string, setting: unknown): string | undefined {
  const folder = dirname(articleFile);
  if (typeof setting === 'string') {
    const path = resolve(folder, setting);
    if (!exists(path)) {
      throw new Error(
        `bibliography: "${setting}" does not exist next to ${basename(articleFile)}.\n` +
          `  Fix: check the file name, or remove bibliography to use the single .bib file in the folder.`,
      );
    }
    return path;
  }
  const files = readdirSync(folder).filter((name) => name.endsWith('.bib'));
  if (files.length > 1) {
    throw new Error(
      `Found ${files.join(', ')} next to ${basename(articleFile)}.\n` +
        `  Fix: set bibliography: ${files[0]} in the front matter to choose one.`,
    );
  }
  return files[0] && resolve(folder, files[0]);
}

const cache = new Map<string, { mtime: number; items: Map<string, CslItem> }>();

/** Parses a BibTeX file into CSL-JSON entries by key; cached until the file changes. */
export function loadBibliography(path: string): Map<string, CslItem> {
  const mtime = statSync(path).mtimeMs;
  const cached = cache.get(path);
  if (cached?.mtime === mtime) return cached.items;
  // The published types mark every option as required; citation-js fills in the rest.
  const options = { generateGraph: false } as Parameters<typeof plugins.input.chain>[1];
  const parsed = plugins.input.chain(readFileSync(path, 'utf8'), options) as CslItem[];
  const items = new Map(parsed.map((item) => [item.id, item]));
  cache.set(path, { mtime, items });
  return items;
}

function exists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

function initials(given: string): string {
  return given
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .map((p) => `${p[0]}.`)
        .join('-'),
    )
    .join('');
}

/** "Polyak, B.T." */
function shortName(name: CslName): string {
  if (name.literal) return name.literal;
  const family = [name['non-dropping-particle'], name.family].filter(Boolean).join(' ');
  return name.given ? `${family}, ${initials(name.given)}` : family;
}

/** "Boris T. Polyak", for metadata. */
export function fullName(name: CslName): string {
  if (name.literal) return name.literal;
  return [name.given, name['non-dropping-particle'], name.family].filter(Boolean).join(' ');
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export function year(item: CslItem): string | undefined {
  const value = item.issued?.['date-parts']?.[0]?.[0] ?? item.issued?.literal;
  return value === undefined ? undefined : String(value);
}

/** A Distill-style entry: bold linked title; authors, year; venue; DOI link. */
export function formatReference(item: CslItem): {
  html: string;
  url?: string;
  doi?: string;
  meta: string;
} {
  const doi = item.DOI?.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  const url = item.URL ?? (doi ? `https://doi.org/${doi}` : undefined);
  const title = escapeHtml(item.title ?? item.id);
  const people = (item.author ?? item.editor ?? []).map(shortName);
  const when = year(item);
  const venue = [
    item['container-title'] ?? (item.type === 'book' ? item.publisher : undefined),
    item.volume && `Vol ${item.volume}${item.issue ? `(${item.issue})` : ''}`,
    item.page && `pp. ${item.page}`,
  ]
    .filter(Boolean)
    .join(', ');

  const heading = url
    ? `<a class="el-ref__title" href="${escapeHtml(url)}">${title}</a>`
    : `<span class="el-ref__title">${title}</span>`;
  const details = [
    escapeHtml([joinNames(people), when].filter(Boolean).join(', ')),
    venue && `<i>${escapeHtml(venue)}</i>`,
    doi && `DOI: <a href="https://doi.org/${escapeHtml(doi)}">${escapeHtml(doi)}</a>`,
  ].filter(Boolean);
  const html = details.length ? `${heading}<br>${details.join('. ')}.` : heading;

  const meta = [
    `citation_title=${item.title ?? item.id}`,
    ...(item.author ?? []).map((a) => `citation_author=${fullName(a)}`),
    when && `citation_publication_date=${when}`,
    item['container-title'] && `citation_journal_title=${item['container-title']}`,
    item.volume && `citation_volume=${item.volume}`,
    doi && `citation_doi=${doi}`,
  ]
    .filter(Boolean)
    .join('; ');

  return { html, ...(url && { url }), ...(doi && { doi }), meta };
}
