import type { ArticleData } from '../schema/article.ts';

const STOPWORDS = new Set(
  'a an the on of in for to and with at by from into toward towards is are how why what'.split(' '),
);

const ascii = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .toLowerCase();

/** The family name used in short citations: the last word of the name. */
export function familyName(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? name;
}

/** `<firstAuthorLastName><year><firstSignificantTitleWord>`, e.g. `lovelace2026tour` (spec §9.3). */
export function bibtexKey(data: ArticleData): string {
  const author = ascii(familyName(data.authors[0]?.name ?? 'anonymous')).replace(/[^a-z]/g, '');
  const words = ascii(data.title)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const word = words.find((w) => !STOPWORDS.has(w)) ?? words[0] ?? '';
  return `${author}${data.date.getUTCFullYear()}${word}`;
}

/** Distill style: `Lovelace & Babbage, "Title", Site, 2026.` followed by the DOI or URL. */
export function citationText(data: ArticleData, site: string, url: string): string {
  const names = data.authors.map((a) => familyName(a.name));
  const who =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} & ${names[1]}`
        : `${names[0]}, et al.`;
  const link = data.doi ? `https://doi.org/${data.doi}` : url;
  return `${who}, "${data.title}", ${site}, ${data.date.getUTCFullYear()}. ${link}`;
}

const escapeTex = (s: string) => s.replace(/([&%$#_{}])/g, '\\$1');

/** A BibTeX entry for the article. Names stay as written; BibTeX parses "First Last". */
export function bibtex(data: ArticleData, site: string, url: string): string {
  const fields: [string, string | undefined][] = [
    ['author', data.authors.map((a) => escapeTex(a.name)).join(' and ')],
    ['title', escapeTex(data.title)],
    ['journal', escapeTex(site)],
    ['year', String(data.date.getUTCFullYear())],
    ['url', url],
    ['doi', data.doi],
  ];
  const body = fields
    .filter((f): f is [string, string] => Boolean(f[1]))
    .map(([name, value]) => `  ${name} = {${value}}`)
    .join(',\n');
  return `@article{${bibtexKey(data)},\n${body}\n}`;
}
