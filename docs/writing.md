# Writing articles

An article is a folder in `src/articles/` with an `index.mdx` (or `index.md`) file. The folder name
is the URL slug, and the front matter at the top of the file drives the title block, byline and
index entry. The example article `a-tour-of-elucidate` in the starter shows every feature and is
meant to be copied from.

Start one with `npm run new -- "Article title"`: it creates `src/articles/<slug>/index.mdx` with
valid front matter and `status: draft`, and prints the URL to preview it at. Before publishing,
`npm run check` finds what a build would reject (settings, front matter, unknown labels and
citations, TeX and MDX errors, and type errors) and says where.

## Folder layout

```
src/articles/my-article/
├── index.mdx         the article
├── references.bib    the bibliography, if the article cites anything
├── Hero.astro        optional title visualization
└── figures/          images, data and components used by the article
```

## Front matter

```yaml
---
title: "Understanding Convolutions on Graphs"   # required
description: "The building blocks of GNNs."     # required; one sentence
date: 2026-11-10                                # required
updated: 2026-12-01                             # optional
status: published                               # draft | review | published (default: draft)
doi: 10.5281/zenodo.1234567                     # optional, the bare DOI
category: Research                              # optional; shown in the eyebrow and index
tags: [graphs, deep-learning]                   # optional; each tag gets an index page
license: CC-BY-4.0                              # optional; overrides the site default
abstract: |                                     # optional; Markdown
  We explain…
authors:                                        # required, at least one
  - name: Ada Lovelace
    url: https://example.org/ada
    orcid: 0000-0002-1825-0097
    affiliations: [cam]                         # keys into `affiliations`
    equal: true                                 # equal contribution
affiliations:
  cam: { name: University of Cambridge, url: https://www.cam.ac.uk }
reviews:                                        # optional; listed in the appendix
  - { label: "Reviewer 1", url: https://github.com/me/lab-notes/issues/12 }
bibliography: refs.bib                          # optional; only if the folder has several .bib files
hero: { width: page, position: below }          # see "Hero" below
toc: true                                       # table of contents (default: true)
layout: article                                 # article (default) | bespoke
header: true                                    # bespoke only: false leaves out the site header
---
```

Mistakes are reported with the file, the field and the expected form:

```
src/articles/gnn/index.mdx → authors[0].orcid
  "1234" is not a valid ORCID. Expected 0000-0000-0000-0000 (last character may be X).
```

`layout: bespoke` gives the article a design of its own; see
[customizing.md](customizing.md#7-per-article).

## Status

| Status | Dev server | Production build | Listed in the index |
|---|---|---|---|
| `draft` | Visible, with a "Draft" banner | Not built | No |
| `review` | Visible, with an "In review" banner | Built at its URL, `noindex` | No |
| `published` | Visible | Built | Yes |

## Text and sections

Standard Markdown with GitHub extensions: tables, footnotes, strikethrough and task lists. Link to
other pages of the site with root paths, such as `[About](/about/)`; when the site lives under a
path (`url: 'https://ada.github.io/notes'`), Elucidate adds it (`/notes/about/`). `##`
starts a section and `###` a subsection; `#` is reserved for the title. Sections appear in the
table of contents, numbered `01`, `02`, … with subsections nested under them. The contents float
in the left margin on screens 1280 px and wider and fold into a "Contents" disclosure under the
byline on smaller screens.

With `numbering.sections: true` in `elucidate.config.ts`, sections are numbered 1, 2, … and
subsections 1.1, 1.2, …, in the headings and in the contents.

## Math

Inline math goes between single dollar signs and display math between double ones. A
`\label{eq:…}` numbers a display equation so the text can refer to it:

```md
The step size $\alpha$ controls each update:

$$
w^{k+1} = w^k - \alpha \nabla f(w^k) \label{eq:gd}
$$
```

Equations without a label are not numbered. Math is rendered at build time with KaTeX (default) or
MathJax (`math.engine: 'mathjax'`, see [configuration](configuration.md)), with MathML for screen
readers; pages without math load no math CSS. Macros defined in `math.macros` work in every article.
A dollar sign followed by a space, or a closing one followed by a digit, is text, so prices like
$5 and $10 need no escaping; write `\$` when in doubt. TeX errors stop the build with the file and
line:

```
src/articles/gnn/index.mdx:42:1 → $$ \frac{a $$
  Unexpected end of input in a macro argument, expected '}' at end of input: \frac{a
```

## Figures and tables

Use Markdown images with alt text; they are optimized at build time and load lazily. An image
without alt text is a build warning.

```md
![A contour plot with a zig-zag path toward the minimum.](./figures/landscape.png)
```

Wrap an image, a component or a table in `Figure` to number it and give it a caption. No import is
needed in `.mdx` files:

```mdx
<Figure id="fig:landscape" width="wide" caption="Gradient descent on a narrow valley."
  description="A contour plot of an elongated bowl. The path zig-zags across the valley.">
  ![A contour plot with a zig-zag path toward the minimum.](./figures/landscape.png)
</Figure>
```

| Prop | Meaning |
|---|---|
| `id` | `fig:…` for figures, `tbl:…` for tables. Needed for a number and cross-references; without it the figure is unnumbered. |
| `kind` | `figure` (default) or `table`. Tables are numbered separately and have their caption above. |
| `width` | `text` (default), `wide`, `page`, `screen`, or `margin` (beside the text on screens 1280 px and wider). |
| `caption` | Plain-text caption. |
| `description` | A longer description for screen readers and anyone who wants it, behind a "Description" disclosure. |
| `fallback` | A static image, imported or a URL, shown instead of the content in print and without JavaScript. |
| `credit` | Source of a figure you reuse, e.g. `credit="Goh (2017)"`; shown as "Figure from …". |

For a caption with math, code, links or citations, pass it as a child with `slot="caption"`:

```mdx
<Figure id="tbl:results" kind="table">
  <Fragment slot="caption">Test error for each $\alpha$, as in @fig:landscape.</Fragment>

| $\alpha$ | Error |
| --- | --- |
| 0.1 | 3.2% |

</Figure>
```

### Interactive figures

A figure can hold any component, interactive ones included. Give it a `description` (a build
warning reminds you when a figure with a `client:` island has none) and a `fallback` image:

```mdx
import Explorer from './figures/Explorer.astro';
import explorerStill from './figures/explorer.png';

<Figure id="fig:explorer" width="wide" caption="Momentum at work."
  description="Two paths descend a long valley; the one with momentum gets there in fewer steps."
  fallback={explorerStill}>
  <Explorer />
</Figure>
```

Writing the component itself, its colors and its controls: [customizing.md](customizing.md#5-interactive-figures)
and [components.md](components.md#the-data-palette).

## Asides, notes, wide content and overlays

```mdx
<Aside>A remark in the margin on wide screens, inline on narrow ones.</Aside>

<Note label="Caveat">A short passage set apart in the column.</Note>

<Block width="page">Anything that needs more room.</Block>

<Overlay id="explorer" title="Momentum explorer" size="full" trigger="Open the explorer">
  <Explorer />
</Overlay>
```

An overlay opens from its button or from any link to its `id` (`[open it](#explorer)`), and the
URL then ends in `#explorer`, so the view can be shared. All props are in
[components.md](components.md); your own components work the same way
([customizing.md](customizing.md#4-your-own-components)).

## Cross-references

Write `@fig:…`, `@tbl:…`, `@eq:…` or `@sec:…` in the text to link to a figure, table, equation or
section. The link reads "Figure 2", "Table 1", "Equation 3", "Section 4", or the section title when
sections are not numbered. A section's label is `sec:` plus its slug: `## Gradient descent` is
`@sec:gradient-descent`. An unknown label stops the build and suggests the closest one:

```
src/articles/gnn/index.mdx:57:4 → @eq:los
  Unknown label. Did you mean @eq:loss?
```

## Citations

Put a BibTeX file next to `index.mdx` (any name ending in `.bib`) and cite entries by key:

```md
Momentum speeds up convergence [@polyak1964], as shown before [@goh2017; @sutskever2013].
```

Citations are numbered in order of first use. Hovering over, focusing or tapping a number shows the
reference; the full list is in the appendix, in the Distill style, with links from `url` or `doi`.
Entries without either are a build warning. An unknown key stops the build with the closest match.
If the folder has more than one `.bib` file, name the one to use with `bibliography:` in the front
matter. The dev server reads the `.bib` file when the article changes, so after editing only the
bibliography, save the article once.

## Footnotes

Footnotes use the usual Markdown syntax:

```md
Momentum has a physical interpretation.[^ball]

[^ball]: A heavy ball rolling down the loss surface.
```

On screens 1280 px and wider a footnote appears in the right margin next to its reference; on
narrower screens it opens like a citation. All footnotes are also listed in the appendix. Notes
with lists or other blocks stay out of the margin and open as cards.

## Appendix

The end of every article is generated from the front matter and the text: discussion and review
links (`reviews`), footnotes, references, updates and corrections (`updated`, and links to the
change history and a prefilled issue when the site sets `repository`), the license, and a citation
box with a copyable citation and BibTeX entry.

Sections you write go before the generated ones. Use them at the end of the article:

```mdx
<Acknowledgments>We thank …</Acknowledgments>

<Contributions>A.L. wrote the article; C.B. drew the figures.</Contributions>

<AppendixSection title="A. Proofs" id="sec:proofs">
  …
</AppendixSection>
```

An `AppendixSection` with an `id` starting with `sec:` can be cited in the text, e.g. `@sec:proofs`.

## Hero

A visual under (or above) the title, found by convention in the article folder:

- `Hero.astro`: any Astro component. To use a Svelte or React component, add its Astro integration
  and render it from `Hero.astro`, e.g. `<MyHero client:visible />`.
- `hero.svg`, `hero.png`, `hero.jpg`, `hero.webp` or `hero.avif`: an image. It needs alt text in
  the front matter: `hero: { alt: "…" }`.

`hero.width` is `page` (default), `wide` or `screen`; `hero.position` is `below` (default) or
`above`. Without a hero, the title block is typographic only.

## Pages

Markdown and MDX files in `src/pages/` become pages with the Page layout: the site header, a
title, the same prose typography as articles, and the footer. They accept `title` and
`description` front matter. `.astro` pages can use the layout directly:

```astro
---
import { Page } from 'astro-elucidate/layouts';
---
<Page title="Team">…</Page>
```

### A homepage of your own

With `home: 'page'` in `elucidate.config.ts`, `src/pages/index.mdx` (or `.astro`) is the homepage
and the article index moves to `/<routes.articles>/`, titled by the menu item that links to it.
`<ArticleList />` shows the latest articles anywhere, in the same rows as the index:

```mdx
---
title: Lab Notes
description: What we are working on.
---

We study how graphs learn. The latest:

<ArticleList limit={3} />

[All articles](/research/)
```
