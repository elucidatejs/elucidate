# Configuration reference

Site settings live in `elucidate.config.ts` and are validated when the dev server or build starts.
A new site needs only `title` and `url`; everything else has a default. Unknown keys are errors that
suggest the closest valid key.

```ts
import { defineConfig } from 'astro-elucidate/config';

export default defineConfig({
  title: 'Lab Notes',
  url: 'https://example.github.io/lab-notes',
});
```

`astro.config.ts` passes it to the integration:

```ts
import { defineConfig } from 'astro/config';
import elucidate from 'astro-elucidate';
import config from './elucidate.config';

export default defineConfig({ integrations: [elucidate(config)] });
```

The integration sets Astro's `site` and `base` from `url`, adds MDX and the sitemap, and configures
Markdown and fonts, so you don't set those yourself.

## Options

| Option | Default | Meaning |
|---|---|---|
| `title` | required | Publication name: wordmark, page titles, footer. |
| `url` | required | Full public URL with protocol. A path (`/lab-notes`) becomes the base path, and all internal links include it. |
| `description` | `''` | Intro on the article index, default meta description, and the summary in the RSS feed and `llms.txt`. |
| `logo` | none | Path of an image in `public/` (e.g. `'/logo.svg'`) shown instead of the title as wordmark. |
| `publisher` | `title` | Publisher name in the footer and the scholarly meta tags. |
| `issn` | none | ISSN, for the scholarly meta tags. |
| `nav` | `[{ label: 'Research', href: '/' }]` | Header and footer links. Paths starting with `/` get the base path. |
| `home` | `'index'` | `'index'`: the article index is the homepage. `'page'`: `src/pages/index.mdx` (or `.astro`) is the homepage and the index moves to `/<routes.articles>/`, titled by the `nav` item that links there (else "Articles"); see [writing.md](writing.md#a-homepage-of-your-own). |
| `routes.articles` | `'research'` | URL segment for articles: `/research/<slug>/`, tags at `/research/tag/<tag>/`. |
| `license` | `'CC-BY-4.0'` | Default content license; articles can override it. |
| `repository` | none | Repository URL, for the change history and "report a correction" links in the appendix. If the site is in a subfolder or uses another branch, give the tree URL, e.g. `https://github.com/me/notes/tree/main/site`. |
| `math.engine` | `'katex'` | `'katex'` or `'mathjax'`. MathJax needs `npm install @mathjax/src`; it renders SVG, so pages need no math fonts. |
| `math.macros` | `{}` | TeX macros shared by both engines, e.g. `{ '\\R': '\\mathbb{R}', '\\norm': '\\left\\lVert #1 \\right\\rVert' }`. |
| `numbering.sections` | `false` | Number sections (1, 1.1, …) in headings, the table of contents and cross-references. |
| `index.thumbnails` | `false` | Show a small thumbnail in the index for articles with an image hero. |
| `showcase` | `'dev'` | The component overview at `/components/`: on the dev server only (`'dev'`), also in the built site (`'public'`, kept out of search engines), or not at all (`'off'`). |
| `overrides` | `{}` | Replace structural components, e.g. `{ Byline: './src/overrides/Byline.astro' }`; see [customizing.md](customizing.md#6-overrides). A path that does not exist is an error. |

## Generated files

Besides the pages, every build has:

| File | Contents |
|---|---|
| `/rss.xml` | Published articles, newest first: title, description, date and link. Every page links it. |
| `/sitemap-index.xml` | Every page except articles in review and `/components/` (by `@astrojs/sitemap`). |
| `/llms.txt` | The title and description, then one line per published article: `- [Title](url): description`. |
| `/robots.txt` | Allows everything and points to the sitemap. |

A file of the same name in `public/` or `src/pages/` (e.g. `src/pages/rss.xml.ts`) replaces the
generated one. All URLs include the base path.

## Errors

Problems are reported with the file, the setting and the expected form:

```
elucidate.config.ts → url
  "example.com" is not a full URL. Expected one with protocol, e.g. "https://example.github.io/lab-notes".
```

`home: 'index'` together with a `src/pages/index.*` file is an error, and so is `home: 'page'`
without one; the message says which file to add or remove.

`npm run check` reports these without starting a server or building; see
[writing.md](writing.md).
