# Writing articles

An article is a folder in `src/articles/` with an `index.mdx` (or `index.md`) file. The folder name
is the URL slug, and the front matter at the top of the file drives the title block, byline and
index entry. The example article `a-tour-of-elucidate` in the starter shows every feature and is
meant to be copied from.

## Folder layout

```
src/articles/my-article/
├── index.mdx      the article
├── Hero.astro     optional title visualization
└── figures/       images, data and components used by the article
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
reviews:
  - { label: "Reviewer 1", url: https://github.com/me/lab-notes/issues/12 }
hero: { width: page, position: below }          # see "Hero" below
toc: true                                       # table of contents (default: true)
---
```

Mistakes are reported with the file, the field and the expected form:

```
src/articles/gnn/index.mdx → authors[0].orcid
  "1234" is not a valid ORCID. Expected 0000-0000-0000-0000 (last character may be X).
```

During v0.1 development, `license`, `reviews`, `layout` and `bibliography` are validated but are
used by later milestones (appendix, bespoke layout, citations).

## Status

| Status | Dev server | Production build | Listed in the index |
|---|---|---|---|
| `draft` | Visible, with a "Draft" banner | Not built | No |
| `review` | Visible, with an "In review" banner | Built at its URL, `noindex` | No |
| `published` | Visible | Built | Yes |

## Text and sections

Standard Markdown with GitHub extensions: tables, footnotes, strikethrough and task lists. `##`
starts a section and `###` a subsection; `#` is reserved for the title. Sections appear in the
table of contents, numbered `01`, `02`, … with subsections nested under them. The contents float
in the left margin on screens 1280 px and wider and fold into a "Contents" disclosure under the
byline on smaller screens.

## Images

Use Markdown images with alt text; they are optimized at build time:

```md
![A contour plot with a zig-zag path toward the minimum.](./figures/landscape.png)
```

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
