import { relative } from 'node:path';
import type { Point, Position } from 'unist';
import type { VFile } from 'vfile';

/** Data the plugins export to layouts through `remarkPluginFrontmatter.elucidate` (spec §6.4). */
export interface PluginData {
  hasMath: boolean;
  headings: HeadingData[];
  references: Reference[];
  footnotes: Footnote[];
}

export interface HeadingData {
  depth: number;
  slug: string;
  text: string;
  number?: string;
}

export interface Reference {
  number: number;
  key: string;
  /** The formatted bibliography entry (Distill style). */
  html: string;
  url?: string;
  doi?: string;
  /** Content of the Highwire `citation_reference` meta tag. */
  meta: string;
}

export interface Footnote {
  number: number;
  html: string;
}

/** A target for cross-references: `@fig:…`, `@tbl:…`, `@eq:…`, `@sec:…`. */
export interface Label {
  kind: 'figure' | 'table' | 'equation' | 'section';
  id: string;
  number?: string;
  title?: string;
}

// Inside the vfile module `Map` names vfile's source map type, hence the alias.
type Labels = Map<string, Label>;

declare module 'vfile' {
  interface DataMap {
    elucidateLabels: Labels;
  }
}

/** The plugin data of this file, created on first use. */
export function pluginData(file: VFile): PluginData {
  file.data.astro ??= {};
  const astro = file.data.astro as { frontmatter?: Record<string, unknown> };
  astro.frontmatter ??= {};
  astro.frontmatter.elucidate ??= { hasMath: false, headings: [], references: [], footnotes: [] };
  return astro.frontmatter.elucidate as PluginData;
}

/** Labels collected by the numbering plugin for the cross-reference plugin. */
export function labels(file: VFile): Map<string, Label> {
  file.data.elucidateLabels ??= new Map();
  return file.data.elucidateLabels;
}

/** The front matter Astro parsed for this file. */
export function frontmatter(file: VFile): Record<string, unknown> {
  return ((file.data.astro as { frontmatter?: Record<string, unknown> })?.frontmatter ??
    {}) as Record<string, unknown>;
}

/** Throws a build error that points at the file and line, in the engine's fix-it format. */
export function fail(
  file: VFile,
  place: Position | Point | undefined,
  subject: string,
  message: string,
): never {
  const path = file.path ? relative(file.cwd, file.path) : 'Markdown';
  const at = place && 'start' in place ? place.start : place;
  const where = at ? `${path}:${at.line}:${at.column}` : path;
  throw new Error(`${where} → ${subject}\n  ${message}`);
}

/** Prints a build warning in the same format. */
export function warn(file: VFile, subject: string, message: string): void {
  const path = file.path ? relative(file.cwd, file.path) : 'Markdown';
  console.warn(`[elucidate] ${path} → ${subject}\n  ${message}`);
}
