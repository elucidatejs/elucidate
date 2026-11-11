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

The integration sets Astro's `site` and `base` from `url`, adds MDX, and configures Markdown and
fonts, so you don't set those yourself.

## Options

| Option | Default | Meaning |
|---|---|---|
| `title` | required | Publication name: wordmark, page titles, footer. |
| `url` | required | Full public URL with protocol. A path (`/lab-notes`) becomes the base path, and all internal links include it. |
| `description` | `''` | Intro on the article index and default meta description. |
| `logo` | none | Path of an image in `public/` (e.g. `'/logo.svg'`) shown instead of the title as wordmark. |
| `publisher` | `title` | Publisher name in the footer (and later the citation box). |
| `issn` | none | ISSN, for scholarly metadata. |
| `nav` | `[{ label: 'Research', href: '/' }]` | Header and footer links. Paths starting with `/` get the base path. |
| `home` | `'index'` | `'index'`: the article index is the homepage. `'page'`: `src/pages/index.mdx` (or `.astro`) is the homepage and the index moves to `/<routes.articles>/`. |
| `routes.articles` | `'research'` | URL segment for articles: `/research/<slug>/`, tags at `/research/tag/<tag>/`. |
| `license` | `'CC-BY-4.0'` | Default content license; articles can override it. |
| `repository` | none | Repository URL, for "Updates and corrections" links. |
| `math.engine` | `'katex'` | `'katex'` or `'mathjax'`. |
| `math.macros` | `{}` | TeX macros shared by both engines, e.g. `{ '\\R': '\\mathbb{R}' }`. |
| `numbering.sections` | `false` | Number sections in headings and the table of contents. |
| `index.thumbnails` | `false` | Show a small thumbnail in the index for articles with an image hero. |
| `showcase` | `'dev'` | Component overview page: `'dev'`, `'public'` or `'off'`. |
| `overrides` | `{}` | Replace structural components, e.g. `{ Byline: './src/overrides/Byline.astro' }`. |

During v0.1 development, `repository`, `issn`, `math`, `numbering`, `showcase` and `overrides` are
validated but take effect in later milestones (see the "v0.1 tracking" issue).

## Errors

Problems are reported with the file, the setting and the expected form:

```
elucidate.config.ts → url
  "example.com" is not a full URL. Expected one with protocol, e.g. "https://example.github.io/lab-notes".
```

`home: 'index'` together with a `src/pages/index.*` file is an error, and so is `home: 'page'`
without one; the message says which file to add or remove.
