# Elucidate — Specification

> Web-native scientific articles in the spirit of Distill: rigorous scholarly structure, free-form interactive visuals, calm design.

This document is the build guide for Elucidate v0.1. It is written for the implementer (human or coding agent) and doubles as the record of agreed decisions. The README, AGENTS.md and `docs/` are derived from it (see §17).

---

## Start here (for Claude Code)

You are implementing Elucidate in the GitHub repository **`elucidatejs/elucidate`** (organization `elucidatejs`). The repo may be empty or contain only a README/LICENSE.

**Your first actions**

1. Read this spec fully once. Then read §20 and check each item against current documentation before writing code that depends on it.
2. Create a branch `m0-skeleton`, commit this file as **`docs/spec.md`** (the source of truth; `AGENTS.md` links to it), and implement milestone M0 (§18).
3. Open a GitHub issue **"v0.1 tracking"** with one checkbox per milestone (M0–M5). Tick boxes as milestones merge.

**How to work**

- **One branch and one pull request per milestone** (`m1-articles`, `m2-scholarly`, …). Split a milestone into several PRs only if it exceeds roughly 1,500 changed lines.
- **PR description:** what changed (≤ 10 bullets), the milestone's "Done when" checklist with each item ticked, any deviations from the spec, screenshots for visual changes (light and dark, mobile and desktop).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Add a changeset when a published package's public API (§11.9) or behavior changes.
- **Done for every PR:** CI green; new behavior covered by tests; affected docs updated in the same PR; budgets (§13.3) not exceeded.
- **Look at what you build.** For any visual change, run `pnpm shots` (§16): it builds the starter and saves screenshots of the changed pages at 375 px and 1440 px, light and dark, to `.screenshots/` (git-ignored). Open the images and compare them with §12 before opening the PR. Fix what looks wrong, then mention in the PR what you checked. If no browser is available in your environment, say so in the PR and rely on the CI screenshots.
- **The maintainer reviews and merges.** Don't merge your own PRs, push to `main`, publish to npm, change repository or organization settings, or create other repositories. Steps that need those permissions are listed in §21. Tell the maintainer when one becomes necessary.
- **Decide, don't stall.** When the spec is silent or a tool behaves differently than described, pick the simplest option consistent with §2 and record it under "Deviations" in `docs/architecture.md`. Ask the maintainer only when a choice is irreversible or contradicts a decision in §3.
- **Stay in scope.** Anything in §19 is out of scope even if it seems easy. If you see something important that's missing, open an issue labeled `idea` instead of building it.

---

## 0. How to use this spec

1. Read §1–§3 first. They contain the goals, the mantra and the decisions. Everything else follows from them.
2. Build milestone by milestone (§18). Each milestone ends in a working, tested state.
3. Versions in this spec were current on 2026‑11‑11. **Before writing code, verify every item in §20 ("Verify at implementation time") against current docs.** If reality differs, prefer the simplest solution that preserves the behavior described here, and note the deviation in `docs/architecture.md`.
4. When this spec is silent, choose the option that adds the least code, the fewest dependencies and the least for a user to learn.
5. "MUST" = required for v0.1. "SHOULD" = expected unless it costs disproportionately. "Later" = explicitly out of scope; do not build it, but do not design it out either.

---

## 1. Summary

**Elucidate** is an open-source (MIT) publishing tool for scientific articles on the web. One installation = one publication (a lab, a journal, a research group) with many articles.

An article has everything a paper needs: title, abstract, authors and affiliations, date, DOI, table of contents, numbered sections, figures and equations with cross-references, citations and bibliography, footnotes, appendix and a "cite this" block. It can also contain **any programmed visualization**: plain JS, D3, Svelte, React, WebGL, anything that runs in a browser, plus overlays and tools that float over them.

It ships as:

- **`astro-elucidate`** – an Astro integration (the engine: layouts, components, markdown processing, theme).
- **`create-elucidate`** – a one-command starter (`npm create elucidate@latest`).
- **`starter/`** – the site template users get; it is also the demo site and the end-to-end test target.

Output is a fully static site, deployable from a Git repo to GitHub Pages (primary) or any static host.

### 1.1 Goals (v0.1)

- Write an article in MDX with scholarly features that work out of the box.
- Put any interactive visualization anywhere in an article, at any of four widths, with near-zero cost to pages that don't use one.
- Look good by default (§12), be fully restyleable without forking (§11).
- Responsive from 320 px phones to wide desktops; WCAG 2.2 AA.
- Deploy from Git with one workflow file.
- Be easy for people **and coding agents** to understand, extend and operate.

### 1.2 Non-goals (v0.1)

Search, PDF export, Crossref/Zenodo DOI deposit, comments, a full peer-review workflow, Jupyter import, multiple citation styles, auto-generated social images, multi-publication hosting, articles in separate repos, i18n, a CMS/editor UI, server-side features. See §19 (Roadmap).

---

## 2. Principles

**Lightweight is the mantra.** It applies to the code, the dependencies, the repo, the README, the docs and the rendered pages.

Concrete rules:

- **Necessary only.** Every feature, file, dependency and config option must serve a v0.1 goal. If in doubt, leave it out and make sure it can be added later.
- **Progressive disclosure.** The README fits on roughly two screens. Details live in `docs/`, linked from the README. Code comments explain _why_, not _what_.
- **Defaults over configuration.** Every option has a sensible default; a new site needs only a title and URL.
- **Conventions over options.** E.g. `references.bib` in an article folder is picked up automatically; a `Hero.astro` file in an article folder becomes the article's hero.
- **Small files.** Aim for files under ~200 lines. One concern per file.
- **Few dependencies.** Each runtime dependency is justified in `docs/architecture.md`. Prefer platform features (native `<dialog>`, Popover API, CSS layers, CSS grid) over libraries.
- **Zero JS by default.** A text-only article ships only the core script (§13.3 budget). Visualizations add their own JS only when present.

**UX (readers):** fast, calm, readable, accessible, works without JS for reading, prints legibly.

**DX (authors and developers):** one command to start, one command to add an article, live reload, typed config, errors that say _where_ and _how to fix_.

**AX (coding agents):**

- `AGENTS.md` in both the engine repo and the starter, short and task-oriented.
- One example article that uses every feature, intended to be copied from.
- A component overview page showing every component next to its source snippet.
- Predictable file layout and naming; no hidden magic beyond what `AGENTS.md` documents.
- Machine-checkable: typed config, schema-validated front matter, a `check` script that fails loudly with fix-it messages.
- Docs are plain Markdown in the repo; the built site exposes `/llms.txt`.

---

## 3. Decisions (agreed)

| Topic              | Decision                                                                                                                                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name               | **Elucidate**. npm packages: `astro-elucidate`, `create-elucidate` (`elucidate` and the `@elucidate` scope are taken on npm).                                                                                                                                                             |
| Home               | GitHub organization **`elucidatejs`**, npm organization **`@elucidatejs`** (reserved for future scoped packages; v0.1 publishes only the two unscoped packages). Source: `github.com/elucidatejs/elucidate`. Demo: `elucidatejs.github.io/elucidate`.                                     |
| License            | **MIT** for code. Article content defaults to **CC‑BY‑4.0** (configurable per site and per article).                                                                                                                                                                                      |
| Distribution       | **Package + starter.** Users never edit the package; they customize via the layers in §11 and upgrade with `npm update`.                                                                                                                                                                  |
| Framework          | **Astro 7.x** (7.4.8 current), static output. Node ≥ 22.                                                                                                                                                                                                                                  |
| Authoring          | **MDX** (Markdown + components) via `@astrojs/mdx`. Plain `.md` also accepted.                                                                                                                                                                                                            |
| Markdown pipeline  | Unified (remark/rehype) via `@astrojs/markdown-remark`, because math, citation and cross-reference plugins exist there. Astro 7's default Rust processor (Sätteri) may replace it later (§19).                                                                                            |
| Math               | **Switchable**: `katex` (default) or `mathjax`, rendered at build time. Same syntax, same numbering, same macros for both.                                                                                                                                                                |
| Citations          | BibTeX, rendered at build time, numeric style (Distill), hover cards, auto bibliography.                                                                                                                                                                                                  |
| Publication model  | **One publication** per site.                                                                                                                                                                                                                                                             |
| Article storage    | **One folder per article** in the site repo.                                                                                                                                                                                                                                              |
| Peer review (v0.1) | `status` field (`draft` / `review` / `published`) plus optional review links.                                                                                                                                                                                                             |
| Deploy             | **GitHub Pages** primary (workflow included); other static hosts documented in one line each.                                                                                                                                                                                             |
| Design             | OpenAI-like restraint (monochrome, type-led, sparse visuals) + Letta's technical accents (monospace uppercase labels, category — date eyebrows, numbered ToC, arrow links, faint grid motif) + Distill scholarly frame (byline header, appendix). Color is reserved for data and figures. |
| Pages              | Home (article index _or_ custom page), article index, article, generic page, component overview, 404.                                                                                                                                                                                     |
| Tooling            | pnpm workspace, TypeScript strict, Biome (lint + format), Vitest, Playwright + axe-core, Changesets.                                                                                                                                                                                      |

---

## 4. Repositories and file layout

### 4.0 Organization and repositories

| Where                              | What                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `github.com/elucidatejs/elucidate` | The monorepo below: engine, starter, docs, issues, releases. The only code repo in v0.1.                                                                           |
| `github.com/elucidatejs/.github`   | Org profile README (`profile/README.md`, ~10 lines linking to the main repo) and shared community files (`CODE_OF_CONDUCT.md`, `SECURITY.md`, issue/PR templates). |
| GitHub Pages of `elucidate`        | The starter built as a live demo at `elucidatejs.github.io/elucidate/` (deployed by `ci.yml` on `main`).                                                           |
| npm org `@elucidatejs`             | Owns `astro-elucidate` and `create-elucidate` (published unscoped). Publishing uses npm trusted publishing from GitHub Actions (no long-lived tokens).             |

Later: a `starter` mirror repo marked as a GitHub template, and a docs site, only if needed (§19).

### 4.1 Engine repo (`elucidatejs/elucidate`)

```
elucidate/
├── README.md              ~2 screens: what, quick start, links (§17.1)
├── AGENTS.md              how to work on the engine (§17.3)
├── LICENSE                MIT
├── package.json           workspace root: scripts only
├── pnpm-workspace.yaml
├── biome.json
├── .changeset/
├── .github/workflows/     ci.yml, release.yml
├── docs/                  everything else, one topic per file (§17.4); this spec is docs/spec.md
├── packages/
│   ├── astro-elucidate/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts            the Astro integration
│   │   │   ├── config.ts           defineConfig + schema + defaults
│   │   │   ├── content.ts          collection definitions (re-exported to sites)
│   │   │   ├── schema/             article / page front-matter schemas
│   │   │   ├── markdown/           remark/rehype plugins (§6.3), one per file
│   │   │   ├── components/         public components (§9)
│   │   │   ├── layouts/            Base, Article, Page, Bespoke
│   │   │   ├── routes/             injected route pages (§10)
│   │   │   ├── styles/             tokens.css, base.css, article.css, components.css, print.css
│   │   │   ├── client/             tiny browser scripts (§6.6)
│   │   │   ├── palette.ts          data palette for visualization code
│   │   │   └── cli/                `elucidate new`, `elucidate check`
│   │   └── test/                   plugin fixtures + unit tests
│   └── create-elucidate/
│       └── src/index.ts            scaffolds a site from starter/
└── starter/               the site template = demo site = e2e target (§4.2)
```

### 4.2 A user's site (what `create-elucidate` produces)

```
my-journal/
├── README.md              short: write, preview, deploy (§17.2)
├── AGENTS.md              how an agent works on this site (§17.3)
├── astro.config.ts        3 meaningful lines
├── elucidate.config.ts    site settings (§5)
├── package.json           scripts: dev, build, preview, new, check
├── .github/workflows/deploy.yml
├── public/                favicon, static files
└── src/
    ├── content.config.ts  1 line: export { collections } from 'astro-elucidate/content'
    ├── articles/
    │   ├── a-tour-of-elucidate/          one folder per article; folder name = URL slug
    │   │   ├── index.mdx
    │   │   ├── references.bib            optional, auto-detected
    │   │   ├── Hero.astro                optional, auto-detected (§7.4)
    │   │   └── figures/                  images, data, visualization components
    │   └── hello-world/                  minimal example (§8)
    ├── pages/
    │   └── about.mdx                     any page; uses the Page layout by default
    ├── components/
    │   └── index.ts                      registry of your own components (§11.4)
    └── styles/
        └── theme.css                     token overrides + custom CSS (§11.2–11.3)
```

`astro.config.ts` in the starter:

```ts
import { defineConfig } from 'astro/config';
import elucidate from 'astro-elucidate';
import config from './elucidate.config';

export default defineConfig({ integrations: [elucidate(config)] });
```

The integration MUST add `@astrojs/mdx`, `@astrojs/sitemap` and the markdown processor itself, and set Astro's `site` and `base` from `elucidate.config.ts`, so users never touch them for basic use.

---

## 5. Configuration (`elucidate.config.ts`)

Typed with `defineConfig` (exported from `astro-elucidate/config`), validated with Zod at startup. Unknown keys are errors with a "did you mean" hint. Deprecated keys produce a warning with the replacement.

```ts
import { defineConfig } from 'astro-elucidate/config';

export default defineConfig({
  // Required
  title: 'Lab Notes',
  url: 'https://example.github.io/lab-notes', // full public URL; base path derived from it

  // Optional (defaults shown)
  description: '', // used in meta tags, RSS, llms.txt
  logo: undefined, // path to an SVG/PNG; falls back to the title as wordmark
  publisher: undefined, // shown in citation box; defaults to title
  issn: undefined,
  nav: [{ label: 'Research', href: '/' }],
  home: 'index', // 'index' = article index is the homepage; 'page' = src/pages/index.(mdx|astro)
  routes: { articles: 'research' }, // /research/<slug>/ ; index at /research/ when home = 'page'
  license: 'CC-BY-4.0', // default content license for articles
  repository: undefined, // e.g. 'https://github.com/me/lab-notes' → "Updates and corrections" links
  math: {
    engine: 'katex', // 'katex' | 'mathjax'
    macros: {}, // { '\\R': '\\mathbb{R}' } shared by both engines
  },
  numbering: { sections: false }, // figures, tables, equations are always numbered
  index: { thumbnails: false }, // show image-hero thumbnails in the article index
  showcase: 'dev', // component overview page: 'dev' | 'public' | 'off'
  overrides: {}, // §11.5
});
```

Rules:

- `url` MUST include protocol. If it has a path (`/lab-notes`), that becomes Astro's `base`. All internal links MUST respect `base`.
- `home: 'index'` with an existing `src/pages/index.*` is a configuration error with a fix-it message (and vice versa: `home: 'page'` without one).
- Config is exposed to engine code through a virtual module (`virtual:elucidate/config`); never re-read from disk at runtime.

---

## 6. Architecture

### 6.1 Integration lifecycle

In `astro:config:setup`, the integration:

1. Validates the user config (§5).
2. Calls `updateConfig` to set `site`, `base`, the markdown processor and plugins (§6.3), and adds `@astrojs/mdx` and `@astrojs/sitemap`.
3. Registers virtual modules: `virtual:elucidate/config`, `virtual:elucidate/overrides` (resolved override components, §11.5), `virtual:elucidate/user-components` (§11.4).
4. Injects routes (§10).
5. Injects the stylesheet order (§6.5) and the core client script (§6.6).

### 6.2 Content collections

`astro-elucidate/content` exports `collections`:

- `articles`: glob loader over `src/articles/*/index.{md,mdx}`; ID = folder name; schema §7.1.

Non-article pages are ordinary Astro pages in `src/pages/` (§10.4); they are not a collection.

### 6.3 Markdown pipeline

One plugin per concern, each in its own file under `src/markdown/`, each with fixture tests. Order matters; it is documented at the top of `src/markdown/index.ts`.

| Plugin              | Stage  | Responsibility                                                                                                                                                                                                                                                             |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `remark-math` (dep) | remark | Parse `$…$` and `$$…$$`.                                                                                                                                                                                                                                                   |
| `numbering`         | remark | Walk the document once, in order. Assign numbers to sections (if enabled), `<Figure>`s by `kind` (figure/table), and display equations carrying `\label{…}`. Build a label → `{kind, number, id, title}` map. Strip `\label{…}` and append `\tag{n}` to labeled equations. |
| `crossref`          | remark | Replace `@fig:…`, `@tbl:…`, `@eq:…`, `@sec:…` in text with links ("Figure 2", "Table 1", "Equation 3", "Section 4" or the section title when unnumbered). Unknown label → build error with file:line and closest match.                                                    |
| `citations`         | remark | Load the article's BibTeX (§7.3); replace `[@key]`, `[@a; @b]` with numbered citation nodes in order of first use; unknown key → build error with closest match. Export the ordered bibliography as structured data (§6.4).                                                |
| `footnotes`         | rehype | Turn GFM footnotes into sidenote markup (§9) and export their HTML for the appendix list.                                                                                                                                                                                  |
| `math`              | rehype | Render math with the configured engine (`rehype-katex` or a MathJax equivalent), with MathML for assistive tech. Record `hasMath` so the layout only loads math CSS where needed.                                                                                          |
| `figures-images`    | rehype | Ensure every `<img>` has `alt` (warning if empty), lazy loading, intrinsic sizes.                                                                                                                                                                                          |
| `default-layout`    | remark | For MDX files in `src/pages/` without `layout`, set the Page layout (§10.4).                                                                                                                                                                                               |
| auto-import         | remark | Make built-in components and the user registry available in every MDX file without import statements (use `astro-auto-import` or an equivalent tiny plugin).                                                                                                               |

Citation processing: use `@citation-js/core` + `@citation-js/plugin-bibtex` (or `rehype-citation` if it covers the numeric style, hover data and error reporting with less code). The bibliography format is fixed in v0.1: Distill-like (bold title with link, authors, venue, year, DOI link).

### 6.4 Passing data from plugins to layouts

Plugins attach data to the entry's frontmatter (`file.data.astro.frontmatter.elucidate = {…}`), and layouts read it from `remarkPluginFrontmatter` after `render(entry)`:

```ts
interface PluginData {
  hasMath: boolean;
  headings: { depth: number; slug: string; text: string; number?: string }[];
  references: { number: number; key: string; html: string; url?: string; doi?: string }[];
  footnotes: { number: number; html: string }[];
}
```

This keeps layouts declarative and makes the Appendix overridable as a normal component.

### 6.5 CSS architecture

- All engine CSS lives in cascade layers: `@layer elucidate.reset, elucidate.tokens, elucidate.base, elucidate.components, elucidate.utilities;`
- User CSS (`src/styles/theme.css`) is **unlayered** and loaded last, so it always wins without `!important`.
- Tokens are CSS custom properties prefixed `--el-` (§12.3). Engine class names are prefixed `el-`.
- Math CSS is loaded only on pages with `hasMath`.
- `print.css`: single column, no ToC, sidenotes as footnotes, URLs after links in references, interactive figures replaced by their `fallback` image if provided.

### 6.6 Client scripts

Plain TypeScript, no framework, bundled by Astro. Each is a small module, loaded only where its feature appears:

| Script        | Purpose                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `theme.ts`    | Light/dark/auto toggle; inline pre-paint snippet in `<head>` to avoid flash.                                                |
| `toc.ts`      | Scroll-spy for the floating ToC (IntersectionObserver); mobile "Contents" toggle.                                           |
| `popovers.ts` | Citation and footnote hover/focus cards using the Popover API; positioning; touch support.                                  |
| `overlay.ts`  | `<Overlay>` open/close, URL hash deep-linking, focus return. Exposes `open(id)` / `close(id)` via `astro-elucidate/client`. |
| `copy.ts`     | Copy buttons (BibTeX, citation, code).                                                                                      |

Interactive figures use Astro islands (`client:visible` etc.). The engine adds no client framework.

---

## 7. Content model

### 7.1 Article front matter

```yaml
---
title: "Understanding Convolutions on Graphs" # required
description: "The building blocks of GNNs." # required; one sentence, used in index, meta, RSS
date: 2026-11-10 # required; publication date
updated: 2026-12-01 # optional
status: published # draft | review | published (default: draft)
doi: 10.5281/zenodo.1234567 # optional
category: Research # optional; one short word, shown in the eyebrow and index label
tags: [graphs, deep-learning] # optional; used for index filters
license: CC-BY-4.0 # optional; overrides site default
abstract: | # optional; Markdown; shown under the byline
  We explain…
authors: # required, ≥1
  - name: Ada Lovelace
    url: https://example.org/ada # optional
    orcid: 0000-0002-1825-0097 # optional; validated format
    affiliations: [cam] # keys into `affiliations`
    equal: true # optional; marks equal contribution
  - name: Charles Babbage
    affiliations: [cam, ind]
affiliations: # optional; key → name (+url)
  cam: { name: University of Cambridge, url: https://www.cam.ac.uk }
  ind: { name: Independent researcher }
reviews: # optional → "Discussion and review"
  - { label: "Reviewer 1", url: https://github.com/<owner>/<repo>/issues/12 }
hero: { width: page, position: below } # optional; only if Hero.* exists (§7.4)
toc: true # optional; default true
layout: article # article (default) | bespoke (§9.4)
bibliography: references.bib # optional; default auto-detects *.bib in folder
---
```

Validation errors MUST name the file, the field and the expected form, e.g.:

```
src/articles/gnn/index.mdx → authors[0].orcid
  "1234" is not a valid ORCID. Expected 0000-0000-0000-0000 (last character may be X).
```

### 7.2 Status

| Status      | Dev server                          | Production build            | Listed in index / RSS / sitemap / llms.txt |
| ----------- | ----------------------------------- | --------------------------- | ------------------------------------------ |
| `draft`     | Visible, with a "Draft" banner      | Not built                   | No                                         |
| `review`    | Visible, with an "In review" banner | Built at its URL, `noindex` | No (shareable link for reviewers)          |
| `published` | Visible                             | Built                       | Yes                                        |

### 7.3 Bibliography

- Default: the single `*.bib` file in the article folder. Multiple `.bib` files → error asking to set `bibliography` explicitly.
- BibTeX entries SHOULD have `url` or `doi`; missing both → warning (references without links are harder to verify).
- Only cited entries are listed.

### 7.4 Hero (custom title visualization)

Convention: if the article folder contains `Hero.astro` (or `Hero.svelte` / `Hero.tsx` when the matching Astro integration is installed) or an image `hero.(svg|png|jpg|webp|avif)`, it is rendered as the article hero.

- `hero.width`: `wide` | `page` (default) | `screen`
- `hero.position`: `below` (default; eyebrow, title and description, then the visual) | `above` (visual first, then eyebrow and title)
- Interactive heroes hydrate with `client:visible`. A static image hero needs an alt text: `hero.alt` (required when an image hero exists).
- No hero → typographic header only.

### 7.5 Pages

Ordinary Astro pages in `src/pages/`. MDX pages accept `title`, `description` and optional `layout` front matter; they use the Page layout by default (§10.4).

---

## 8. Authoring syntax

The example article in the starter (`a-tour-of-elucidate`) MUST demonstrate every item in this section. The starter also contains a second, short article (`hello-world`: text, one image figure, one citation) so the index shows more than one row and new users see a minimal example next to the complete one.

### 8.1 Text, sections, asides, layout

Standard Markdown (GFM: tables, footnotes, strikethrough, task lists).

- Headings: `##` are sections, `###` subsections. `#` is reserved for the title (an `#` in the body → warning).
- Section IDs are auto-slugged; cross-reference with `@sec:<slug>`.
- `<Aside>…</Aside>`: margin note on wide screens, inline note (left hairline) on narrow ones. Not numbered.
- `<Block width="wide|page|screen">…</Block>`: put any content at a wider width.

### 8.2 Math

```mdx
Inline $\alpha_t$ and display:

$$
w^{k+1} = w^k - \alpha \nabla f(w^k) \label{eq:gd}
$$

As @eq:gd shows, …
```

- `\label{eq:…}` numbers the equation; unlabeled display equations are not numbered.
- Same syntax for KaTeX and MathJax. The docs list the supported common subset; engine-specific commands are allowed but flagged in docs as non-portable.
- Macros: `math.macros` in config.

### 8.3 Figures and tables

```mdx
import LossLandscape from './figures/LossLandscape.svelte'

<Figure id="fig:landscape" width="page"
        caption="Gradient descent on a quadratic. Drag the start point."
        description="A contour plot with an orange path that zig-zags toward the minimum…">
  <LossLandscape client:visible />
</Figure>

<Figure id="tbl:results" kind="table" caption="Results on the benchmark.">
| Model | Accuracy |
|---|---|
| Baseline | 71.2 |
</Figure>

See @fig:landscape and @tbl:results.
```

`<Figure>` props:

| Prop          | Default  | Meaning                                                                                                                                                                                                                 |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | –        | `fig:…` or `tbl:…`; required for numbering and cross-refs. Without `id` the figure is unnumbered.                                                                                                                       |
| `kind`        | `figure` | `figure` → "Figure n", `table` → "Table n"                                                                                                                                                                              |
| `width`       | `text`   | `text` / `wide` / `page` / `screen` / `margin`                                                                                                                                                                          |
| `caption`     | –        | Plain caption. For rich captions (math, links) use a `slot="caption"` child.                                                                                                                                            |
| `description` | –        | Long text description for screen readers and anyone who wants it; rendered behind a small "Description" disclosure. Strongly recommended for interactive figures (warning if missing on a figure containing an island). |
| `fallback`    | –        | Static image used for print and when JS is unavailable.                                                                                                                                                                 |
| `credit`      | –        | "Figure from …" attribution; such figures are excluded from the reuse license statement.                                                                                                                                |

Images: `<Figure>` wraps Markdown images or Astro `<Image>`; `alt` is required.

### 8.4 Citations and footnotes

```mdx
Momentum accelerates convergence [@polyak1964; @nesterov1983].
This needs a caveat.[^1]

[^1]: Only on quadratics.
```

- Citations render as `[1, 2]` superscript-sized links. Hover or focus shows a card with the full reference; click jumps to the bibliography.
- Footnotes render as numbered sidenotes in the right margin on wide screens, as tap/focus popovers on narrow screens, and are listed under "Footnotes" in the appendix.

### 8.5 Interactive figures and visualization code

- Any component framework Astro supports, added the normal way (`npx astro add svelte`). The starter itself uses only `.astro` + vanilla TS, so it has no framework dependency.
- Vanilla/D3: an `.astro` component with a `<script>`; the script is bundled and runs once per instance.
- Colors: import the data palette (§12.4) so figures follow the theme and dark mode:

```ts
import { palette, onThemeChange } from 'astro-elucidate/palette';
const c = palette(); // { categorical: string[8], sequential: (t)=>string, diverging: (t)=>string, text, muted, grid }
onThemeChange(() => redraw(palette()));
```

- Large data files: `public/` or the article folder; documented guidance to use Git LFS or object storage beyond ~10 MB.

### 8.6 Overlays

```mdx
<Overlay id="explorer" title="Activation explorer" size="full" trigger="Open the explorer">
  <Explorer client:only="svelte" />
</Overlay>
```

- Built on native `<dialog>` (modal). `size`: `dialog` (centered, ≤ 720 px), `drawer` (right side), `full` (full viewport).
- Opening sets the URL hash (`#explorer`); loading a URL with that hash opens it; closing restores focus to the trigger.
- Tools on top of an overlay (tooltips, menus, legends) use the Popover API / top layer, so stacking works without z-index wars. z-index tokens exist for non-top-layer elements (§12.3).
- Esc closes; backdrop click closes (`dismissible={false}` to disable); focus is trapped inside.
- JS API: `import { open, close } from 'astro-elucidate/client'`.

### 8.7 Appendix content written by authors

Placed at the very end of the MDX file; rendered as the first sections of the appendix band:

```mdx
<Acknowledgments>We thank …</Acknowledgments>
<Contributions>A.L. wrote the article; C.B. built the visualizations.</Contributions>
<AppendixSection title="A. Derivations" id="sec:derivations">…</AppendixSection>
```

Everything else in the appendix is generated (§9.3).

---

## 9. Components

### 9.1 Built-in authoring components (auto-imported in MDX)

`Figure`, `Block`, `Aside`, `Overlay`, `Acknowledgments`, `Contributions`, `AppendixSection`, `ArticleList` (§10.1), `Button` (pill: `primary` / `secondary`), `Note` (inline callout, hairline, no color).

That is the complete v0.1 set. Each has typed props, a usage example on the component overview page (§10.5), and a section in `docs/components.md`.

### 9.2 Structural components (used by layouts; overridable, §11.5)

| Name              | Renders                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Head`            | `<title>`, meta, scholarly tags (§14), fonts, theme pre-paint script                                                  |
| `Header`          | Site wordmark/logo, nav, theme toggle                                                                                 |
| `Footer`          | Publication name, nav, RSS link, license note                                                                         |
| `ArticleHero`     | Hero visual (§7.4) + title + description                                                                              |
| `Byline`          | Distill grid: **Authors · Affiliations · Published · DOI** (+ "Updated" when set; equal-contribution and ORCID marks) |
| `TableOfContents` | Floating ToC (wide) / "Contents" disclosure (narrow)                                                                  |
| `Appendix`        | Generated appendix (§9.3)                                                                                             |
| `ArticleCard`     | One row in the article index                                                                                          |

### 9.3 Generated appendix (order follows Distill)

1. Acknowledgments _(author-written, §8.7)_
2. Author contributions _(author-written)_
3. Supplementary sections _(`AppendixSection`, author-written)_
4. **Discussion and review**: links from `reviews`; omitted if none.
5. **Footnotes**: numbered list with back-links.
6. **References**: numbered bibliography.
7. **Updates and corrections**: if `repository` is set, links to the article's change history (`<repo>/commits/main/src/articles/<slug>`) and to "report an issue" (prefilled issue URL with the article title). If `updated` is set, the date.
8. **Reuse**: generated from the license (templates for `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC0-1.0`; any other value is printed verbatim). Mentions that figures with a `credit` are excluded.
9. **Citation**: a plain citation line and a BibTeX block, each with a copy button. BibTeX key: `<firstAuthorLastName><year><firstSignificantTitleWord>`.

### 9.4 Bespoke layout

`layout: bespoke` renders only `Head`, `Header` (unless `header: false`) and the MDX content. Authors compose the page from exported blocks: `<ArticleTitle/>`, `<Byline/>`, `<Abstract/>`, `<TableOfContents/>`, `<Appendix/>`. Metadata, numbering, citations and meta tags still work. This is the escape hatch for essay-style pages with fully custom design.

---

## 10. Pages and routes

### 10.1 Home and article index

- `home: 'index'` → the article index is at `/`.
- `home: 'page'` → `/` is the user's `src/pages/index.(mdx|astro)`; the index is at `/<routes.articles>/`.
- Index design (OpenAI/Letta-like single-column list): page title + optional intro (`description`), tag filter pills (no JS needed: each tag has its own static page `/<routes.articles>/tag/<tag>/`), then rows of **label line (`CATEGORY — DATE`) · title · description**. No thumbnails by default; `index.thumbnails: true` in config shows a small thumbnail when an article has an image hero. Newest first. Lists only `published`.
- `<ArticleList limit={5} tag="graphs" />` renders the same rows anywhere (e.g. a custom home page).

### 10.2 Article: `/<routes.articles>/<slug>/`

Order: header → hero/title → byline → abstract → body (with floating ToC and margin column) → appendix band → footer.

### 10.3 Feeds and machine-readable files

- `/rss.xml`: published articles (title, description, date, link).
- `/sitemap-index.xml` via `@astrojs/sitemap` (excludes `review`).
- `/llms.txt`: publication title and description, then one line per published article: `- [Title](url): description`.
- `/robots.txt`: allow all, point to sitemap.

### 10.4 Generic pages

Any `src/pages/*.mdx` uses the Page layout by default: header, title, prose column (same typography as articles, no byline/appendix), footer. `.astro` pages can import `Page` from `astro-elucidate/layouts`.

### 10.5 Component overview: `/components/`

- Lists every built-in authoring component and every component in the user registry (§11.4).
- For each: rendered example + its source snippet + link to docs.
- User components get an example if a sibling `<Name>.example.mdx` exists; otherwise they are listed by name.
- Visibility: `showcase: 'dev'` (default; dev server only), `'public'`, or `'off'`. Marked `noindex` when public.
- It is also the main target for accessibility and visual tests.

### 10.6 404

Minimal page with a link home.

---

## 11. Customization model

Users customize **only inside their site repo**. Layers, lightest first; most sites only need 1–3.

### 11.1 Settings

`elucidate.config.ts` (§5).

### 11.2 Theme tokens

Override any `--el-*` token in `src/styles/theme.css`:

```css
:root {
  --el-font-sans: "Geist", system-ui, sans-serif;
  --el-width-text: 700px;
}
:root[data-theme="dark"] {
  --el-bg: #000;
}
```

### 11.3 Custom CSS

Same file; unlayered, therefore always wins over engine CSS (§6.5).

### 11.4 Your own components

Put components in `src/components/` and export them from `src/components/index.ts`:

```ts
export { default as Callout } from './Callout.astro';
export { default as Heatmap } from './Heatmap.svelte';
```

They become available in all MDX files without imports and appear on `/components/`. Names that clash with built-ins are an error.

### 11.5 Overrides

Replace a structural component (§9.2) with your own:

```ts
overrides: {
  Byline: './src/overrides/Byline.astro';
}
```

The override receives the same typed props (exported as `BylineProps` etc. from `astro-elucidate/types`). To wrap rather than replace, import the original from `astro-elucidate/components/Byline.astro`.

### 11.6 Pages and routes

Add any page in `src/pages/`; rename the article route with `routes.articles`; choose the home mode with `home`.

### 11.7 Per article

Co-located CSS imported in the MDX, co-located components, `Hero.astro`, and `layout: bespoke`.

### 11.8 Astro itself

It's a normal Astro project: add integrations, Vite settings, etc. in `astro.config.ts`.

### 11.9 Upgrade contract

The **public API** is: config schema, front-matter schema, `--el-*` token names, built-in component names and props, override names and props, `astro-elucidate/{config,content,components,layouts,client,palette,types}` exports, and the MDX syntax in §8. Anything else is internal.

- Semver: breaking public-API changes only in major versions, each with a migration section in `CHANGELOG.md`.
- Deprecations warn for at least one minor release, with the exact replacement.

---

## 12. Design language

### 12.0 References

Study these before styling (for design language only; do not copy their brand assets, logos or proprietary fonts):

| Site                                                                                                                     | Take from it                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [openai.com/research](https://openai.com/research/) and [openai.com/research/index](https://openai.com/research/index/)  | Overall restraint: white canvas, calm 500-weight headings, list-style index, sparse imagery, floating ToC, custom hero visuals.                                                                                               |
| [letta.com](https://www.letta.com/), [letta.com/blog/continual-learning](https://www.letta.com/blog/continual-learning/) | Technical accents: uppercase monospace labels, `CATEGORY — DATE` eyebrow above the title, numbered table of contents, `→` text links instead of buttons, faint background grid, "Cite this post" block with a `COPY` control. |
| [distill.pub/2021/understanding-gnns](https://distill.pub/2021/understanding-gnns/)                                      | Scholarly frame: byline grid under the title, appendix order and content, margin notes, layout widths.                                                                                                                        |
| [goodfire.com/research/interpreting-lm-parameters](https://www.goodfire.com/research/interpreting-lm-parameters)         | Deep numbered ToC, numbered equations and figures, affiliation superscripts.                                                                                                                                                  |

### 12.1 Principles

1. **Type carries the hierarchy**: size, weight and space, not boxes, rules or color.
2. **Monochrome interface**: black, grays, white. Links are text-colored and underlined. No brand blue.
3. **Color means data**: colored pixels belong to figures, plots and visuals.
4. **Calm weight**: headings at weight 500 with slightly tightened tracking at large sizes.
5. **Space over separators**: generous whitespace, few hairlines, no shadows except on overlays.
6. **Sparse, deliberate visuals**: an article may have a hero visualization; otherwise the title stands alone.
7. **Scholarly frame**: Distill byline under the title, Distill appendix at the end.
8. **Technical accents, sparingly**: monospace uppercase labels for metadata (never for prose), `→` for "go somewhere" links, a faint grid only behind the page top. These are the only decorative elements.

### 12.2 Typography

All fonts open-licensed (OFL), self-hosted, only used weights loaded (Astro Fonts API if stable, else `@fontsource`).

| Token             | Default                                      | Role                                                                                                                     |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--el-font-sans`  | **Inter** (variable; 400, 500, 600)          | All text: headings, body, UI. Alternative suggested in docs: Geist.                                                      |
| `--el-font-mono`  | **JetBrains Mono** (400, 500)                | Code, data labels, and the label tier (eyebrows, byline labels, figure numbers, ToC numbers, dates, tags, copy controls) |
| `--el-font-serif` | **Source Serif 4** (not loaded unless used)  | Optional long-form body (`--el-font-body: var(--el-font-serif)`)                                                         |
| `--el-font-body`  | `var(--el-font-sans)`                        | Article body text                                                                                                        |
| Math              | engine default (KaTeX / New Computer Modern) | Not themed                                                                                                               |

Type scale (desktop; mobile ≈ 0.85× for display sizes):

| Token               | Size / line height                 | Weight | Use                                                                 |
| ------------------- | ---------------------------------- | ------ | ------------------------------------------------------------------- |
| `--el-text-display` | 48 / 1.1, tracking −0.02em         | 500    | Article title                                                       |
| `--el-text-h2`      | 28 / 1.25, −0.01em                 | 500    | Section                                                             |
| `--el-text-h3`      | 20 / 1.35                          | 500    | Subsection                                                          |
| `--el-text-lead`    | 22 / 1.45                          | 400    | Description/dek under title                                         |
| `--el-text-body`    | 18 / 1.6                           | 400    | Article body (≈ 68 characters per line)                             |
| `--el-text-ui`      | 16 / 1.5                           | 400    | Pages, nav, index rows                                              |
| `--el-text-small`   | 14 / 1.5                           | 400    | Captions, sidenotes, ToC, byline, appendix                          |
| `--el-text-label`   | 12 / 1.4, +0.06em, uppercase, mono | 400    | Eyebrow, byline labels, figure labels, dates, tags, `COPY` controls |

Tabular numbers (`font-variant-numeric: tabular-nums`) in tables and data labels.

### 12.3 Color and other tokens

| Token                                          | Light            | Dark             |
| ---------------------------------------------- | ---------------- | ---------------- |
| `--el-bg`                                      | #FFFFFF          | #0D0D0D          |
| `--el-surface` (appendix band, code, popovers) | #F7F7F7          | #1A1A1A          |
| `--el-border` (hairlines)                      | #E5E5E5          | #2E2E2E          |
| `--el-text-muted` (captions, metadata)         | #6B6B6B          | #A3A3A3          |
| `--el-text`                                    | #0D0D0D          | #F5F5F5          |
| `--el-accent` (focus, active ToC; brand hook)  | `var(--el-text)` | `var(--el-text)` |
| `--el-backdrop`                                | rgb(0 0 0 / 0.4) | rgb(0 0 0 / 0.6) |

All text/background pairs MUST meet WCAG AA (muted on bg: 5.3:1 light, 7.7:1 dark).

Other tokens:

- **Spacing**: 4 px base (`--el-space-1` = 4 … `--el-space-10` = 96).
- **Widths**: `--el-width-text` 680 px, `--el-width-wide` 920 px, `--el-width-page` 1200 px, screen = 100vw; `--el-width-margin` 240 px (ToC and sidenote columns).
- **Radii**: `--el-radius-sm` 6 px (code, popovers), `--el-radius-md` 12 px (images in cards, overlays), `--el-radius-pill` 999 px (buttons, tags).
- **Shadow**: `--el-shadow-overlay` only.
- **Motion**: `--el-duration` 180 ms, `--el-ease` ease-out; all motion disabled under `prefers-reduced-motion`.
- **Z-index**: `--el-z-header`, `--el-z-toc`, `--el-z-popover` (for non-top-layer cases).
- **Grid motif**: `--el-motif-grid` (a CSS background of 1 px lines every 24 px in `--el-border` at low opacity, fading out downward), applied only behind the header and title block. Set to `none` to disable.

### 12.4 Data palette (for figures only)

- Categorical, 8 colors, colorblind-safe (Okabe–Ito based), with light- and dark-tuned variants: `--el-data-1` … `--el-data-8`.
- Sequential (single hue, perceptually ordered) and diverging (two hues around a neutral midpoint) ramps as tokens `--el-seq-0…8` and `--el-div-0…8`.
- Chart chrome: `--el-data-grid` (axes/gridlines), `--el-data-label` (= muted text).
- Exposed to JS via `astro-elucidate/palette` (§8.5), which reads the resolved CSS values so theme overrides apply automatically.

### 12.5 Layout and grid

CSS grid with named lines on the article container:

```
[screen-start] margin-gutter [page-start] … [wide-start] … [text-start] content [text-end] … [wide-end] … [page-end] margin-gutter [screen-end]
```

Children default to `text`. `width` props and `<Block>` select other lines.

| Breakpoint  | Layout                                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| < 640 px    | Single column, 20 px side padding; wide/page figures go edge-to-edge; ToC = "Contents" disclosure under the byline; sidenotes = popovers. |
| 640–1279 px | Text column centered; wide/page figures use available width; ToC disclosure; sidenotes = popovers.                                        |
| ≥ 1280 px   | Floating, sticky ToC in the left margin column; sidenotes and `<Aside>` in the right margin column.                                       |

### 12.6 Component styling

- **Header**: wordmark left, 3–4 text links, theme toggle (icon button). Transparent; a hairline appears once the page scrolls.
- **Article title block**: eyebrow in label style (`RESEARCH — NOV 11, 2026`; just the date if no `category`) → title (display) → description (lead, muted) → optional hero (§7.4; position configurable) → byline. Faint grid motif behind this block.
- **Byline**: full-width hairline above and below; 4 columns on wide screens (Authors / Affiliations / Published / DOI), 2×2 on medium, stacked on narrow. Labels in `--el-text-label` muted, values in small text. ORCID as a small iD link after the name.
- **Abstract**: body text with a muted "Abstract" label, text width.
- **ToC**: small muted text with two-digit mono numbers (`01`, `02`; subsections indented without numbers unless `numbering.sections`); the active section in full text color with a 2 px left rule; nested one level. A `CONTENTS` label above it.
- **Body**: headings with generous space above (≈ 2.5× body line height).
- **Figure**: no frame. Caption below in small muted text, beginning with "**Figure 3**" (weight 500, text color). The "Description" disclosure sits right-aligned in the caption line.
- **Interactive controls** (styles exported for figure authors as utility classes `el-slider`, `el-segmented`, `el-toggle`): monochrome; slider with a black/white thumb and gray track; segmented pills; focus rings 2 px `--el-accent` with 2 px offset.
- **Citation**: `[1]` small, muted, no underline; hover/focus card on `--el-surface` with border and `--el-radius-sm`, max 360 px wide.
- **Sidenote**: small muted text, number in text color, aligned to its reference line.
- **Aside / Note**: left 2 px `--el-border` rule, muted small text; no background color.
- **Code**: `--el-surface` background, mono 14 px, grayscale syntax highlighting (tone and weight, not hue).
- **Table**: horizontal hairlines only, header in label style, tabular numbers.
- **Links that navigate** ("All research", "Read the paper", "Report an issue"): plain text with a trailing `→` that shifts 2 px on hover. Prefer these over buttons.
- **Buttons** (only for actions that change state, e.g. opening an overlay): primary = filled pill (`--el-text` bg, `--el-bg` text); secondary = outlined pill.
- **Copy controls**: a `COPY` text control in label style that changes to `COPIED` for 2 s; announced to screen readers via `aria-live`.
- **Index row**: label line (`CATEGORY — NOV 2026`, muted) · title (h3 size, 500) · description (muted, max 2 lines); hairline between rows; hover underlines the title. Tags are not shown in rows (they're in the filter pills).
- **Overlay**: `--el-backdrop`, panel on `--el-bg` with `--el-shadow-overlay` and `--el-radius-md` (none for `full`), title bar with close button.
- **Appendix band**: full-width `--el-surface` background, small text. Two-column grid on wide screens (section heading left in label style, content right), stacked on narrow. The Citation section is titled `CITE THIS ARTICLE` and shows the citation line and BibTeX (mono, on `--el-bg`), each with a `COPY` control.
- **Footer**: hairline above, muted small text.

### 12.7 Dark mode and print

- `auto` follows the system; the toggle stores an explicit choice in `localStorage` (wrapped in try/catch).
- Print: §6.5.

---

## 13. Quality requirements

### 13.1 Accessibility (WCAG 2.2 AA)

- Semantic landmarks (`header`, `nav`, `main`, `article`, `aside`, `footer`), one `h1`, ordered headings, skip link.
- Every interactive element keyboard-operable with a visible focus ring; popovers open on focus as well as hover.
- Math emits MathML for screen readers.
- Images require `alt`; interactive figures should have `description` (warning if missing).
- Overlays: focus trap, Esc, focus return, `aria-labelledby`.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Zero axe-core violations on the example article, an index page, a generic page and `/components/`.

### 13.2 Responsiveness

Usable from 320 px width; no horizontal page scroll (wide content scrolls inside its own container if needed). Touch targets ≥ 44 px.

### 13.3 Performance budgets (example article, production build)

- Core client JS ≤ 6 KB gzip (all scripts in §6.6 that the page uses).
- Engine CSS ≤ 25 KB gzip (excluding math CSS).
- Fonts: ≤ 2 files preloaded.
- Lighthouse (mobile) ≥ 95 for Performance, Accessibility, Best Practices, SEO.
- Pages without math, figures or overlays load no math CSS and no figure/overlay JS.

---

## 14. Scholarly metadata (per article `<head>`)

- `<title>`, `meta description`, canonical URL, `lang`.
- Open Graph + Twitter card: title, description, URL, image (hero image if it exists, otherwise none).
- Highwire Press tags for Google Scholar: `citation_title`, `citation_author` (repeated, in order), `citation_author_institution`, `citation_author_orcid`, `citation_publication_date` (YYYY/MM/DD), `citation_online_date`, `citation_journal_title` (site title), `citation_publisher`, `citation_issn` (if set), `citation_doi` (if set), `citation_fulltext_html_url`, `citation_reference` (one per cited work).
- `review` status → `<meta name="robots" content="noindex">`.

---

## 15. CLI

`astro-elucidate` ships a tiny `elucidate` bin. The starter wires it to npm scripts.

- `npm run new -- "Article title"` → creates `src/articles/<slug>/index.mdx` from a template (front matter filled: title, today's date, `status: draft`, one author placeholder) and prints the path and the dev URL.
- `npm run check` → `astro check` + front-matter validation + unresolved references/citations, without a full build; exits non-zero with fix-it messages.
- `npm create elucidate@latest [dir]` → copies `starter/` (via `giget` from the tagged release), rewrites the workspace dependency to the published version, asks only for the site title and URL (both skippable), prints next steps.

---

## 16. Testing, CI, release

- **Unit (Vitest)**: each markdown plugin against fixtures (input MDX → expected numbering, links, errors). Config and front-matter schema validation messages.
- **E2E (Playwright)**: build the starter; check the example article (numbering, cross-ref targets, citation popover keyboard access, ToC scroll-spy, overlay open/close/deep-link, theme toggle, mobile layout at 375 px), index and tag pages, `/components/`, RSS, sitemap, llms.txt, base-path deployment (`url` with a path).
- **Accessibility**: axe-core in Playwright on the pages listed in §13.1.
- **Budgets**: a script that measures JS/CSS sizes of the example article build and fails over budget.
- **Screenshots** (`pnpm shots`, a ~50-line Playwright script, not a test): builds and serves the starter, captures full-page screenshots of the home/index, both example articles, an About page and `/components/` at 375 px and 1440 px in light and dark, plus an open overlay. `pnpm shots -- <path>` captures one page. CI runs it on every PR and uploads the images as a workflow artifact named `screenshots`, so the maintainer can review visuals without running anything. No pixel-diff testing in v0.1.
- **CI** (`ci.yml`): install → Biome → typecheck → unit → build starter → e2e + axe → budgets. Node 22, pnpm. On `main`, also deploy the built starter to GitHub Pages as the live demo.
- **Release** (`release.yml`): Changesets publishes `astro-elucidate` and `create-elucidate`; tags the repo (used by `create-elucidate`).
- **Starter deploy workflow** (`starter/.github/workflows/deploy.yml`): GitHub Pages via the official `withastro/action` (or the equivalent Pages actions) on push to `main`.

---

## 17. Documentation deliverables

Lightweight rule: the README answers _what is this, how do I start, where is the rest_. Everything else lives in `docs/`, one topic per file, each starting with a 2–3 sentence summary.

### 17.1 Engine `README.md` (write this; keep it about this size)

````markdown
# Elucidate

Web-native scientific articles, in the spirit of Distill.

Write in Markdown, drop in interactive visualizations built with anything,
and publish a static site with the scholarly parts done for you:
authors and affiliations, numbered equations and figures, cross-references,
citations, footnotes, an appendix, and a "cite this" box.

<!-- screenshot: an article page, light and dark -->

## Start a publication

```sh
npm create elucidate@latest my-journal
cd my-journal
npm run dev
```

Open http://localhost:4321. You'll see an example article that shows every feature.

## Write an article

```sh
npm run new -- "My first article"
```

Edit `src/articles/my-first-article/index.mdx`:

```mdx
---
title: "My first article"
description: "One sentence about it."
date: 2026-11-10
status: published
authors: [{ name: "Ada Lovelace" }]
---

Gradient descent [@nesterov2004] follows

$$ w^{k+1} = w^k - \alpha \nabla f(w^k) \label{eq:gd} $$

<Figure id="fig:demo" caption="Try it.">
  <MyWidget client:visible />
</Figure>

As @eq:gd and @fig:demo show, …
```

## Publish

Push the site to GitHub, then **Settings → Pages → Source: GitHub Actions**.
Every push to `main` deploys. Other hosts: [docs/deploying.md](docs/deploying.md).

## Learn more

- [Writing articles](docs/writing.md): math, figures, citations, footnotes, overlays
- [Components](docs/components.md)
- [Customizing](docs/customizing.md): settings, theme, your own components, overrides
- [Configuration reference](docs/configuration.md)
- [Design language](docs/design.md)
- [How it works](docs/architecture.md) · [Roadmap](docs/roadmap.md) · [Contributing](docs/contributing.md)

## License

Code: MIT. Example content: CC-BY-4.0.
````

### 17.2 Starter `README.md` (≤ 40 lines)

Commands (`dev`, `new`, `check`, `build`, `preview`), where things live (the §4.2 tree, 8 lines), how to deploy (2 lines), link to the engine docs.

### 17.3 `AGENTS.md` files (≤ 80 lines each)

Starter `AGENTS.md` MUST contain:

- What the project is (2 lines) and the file map.
- Recipes: add an article (`npm run new`), add a figure, add an interactive component and register it, change theme tokens, override a structural component, add a page.
- Rules: never edit `node_modules/astro-elucidate`; customize via §11 layers; run `npm run check` before finishing; every figure needs `alt`/`description`; use the data palette for colors.
- Where to look: the example article and `/components/` as references; engine docs URL.

Engine `AGENTS.md` MUST contain:

- A first line pointing to `docs/spec.md` as the source of truth for scope and decisions.
- Repo map, commands (`pnpm dev` runs the starter against local packages, `pnpm test`, `pnpm e2e`).
- The working rules from "Start here" (branch + PR per change, Conventional Commits, changesets, maintainer merges).
- Principles from §2 in 6 bullets.
- Public API boundary (§11.9): changes there need a changeset and docs.
- How to add a component or markdown plugin (files, test fixture, docs entry, showcase example).

### 17.4 `docs/`

`getting-started.md`, `writing.md`, `components.md`, `customizing.md`, `configuration.md`, `design.md`, `deploying.md` (GitHub Pages in detail; Netlify, Vercel, Cloudflare Pages, any static host in one line each; custom domain; base path), `architecture.md` (pipeline order, data flow, dependency justifications, deviations from this spec), `roadmap.md` (§19), `contributing.md`.

---

## 18. Milestones

Each milestone: code + tests + the docs it affects + green CI.

**M0 Skeleton.** `docs/spec.md` (this file); pnpm workspace, Biome, TypeScript, Vitest and Playwright wired up; CI workflow; `astro-elucidate` as an empty integration; `starter/` with one placeholder page that builds against the local package; `create-elucidate` stub; README and AGENTS.md stubs (final in M5); MIT LICENSE (copyright "The Elucidate authors"); `.github` issue/PR templates only if the org-level `.github` repo doesn't provide them; "v0.1 tracking" issue.
_Done when_ `pnpm i && pnpm build && pnpm test` passes locally and in CI on the PR.

**M1 Articles and design.** Collection + schemas with fix-it errors; Base/Article/Page layouts; tokens, typography (incl. mono label tier), grid, widths, dark mode, grid motif; Header, Footer, ArticleHero (eyebrow + hero convention), Byline, Abstract, TableOfContents (numbered; floating + mobile); index (home `index` mode), tag pages, 404; status handling.
_Done when_ the example article (text, headings, images, a hero) renders correctly at 375/1024/1440 px in light and dark, with zero axe violations.

**M2 Scholarly core.** Math (KaTeX + MathJax switch, macros, labels, numbering), cross-refs, Figure numbering/kinds, footnotes → sidenotes, citations + bibliography, full generated appendix, citation box + BibTeX, scholarly meta tags.
_Done when_ plugin fixture tests pass for both math engines and the example article shows numbered equations/figures/tables, working references, hover cards (mouse, keyboard, touch) and a complete appendix.

**M3 Interactivity and components.** Figure with islands/description/fallback; Block, Aside, Note, Button; Overlay (sizes, hash deep links, focus); data palette JS; user component registry + auto-import; overrides; `/components/` page; bespoke layout.
_Done when_ the example article contains a vanilla-TS interactive figure using the palette and an overlay with a tool floating above it, and a starter test overrides `Byline` and registers a custom component.

**M4 Site features and CLI.** `home: 'page'` mode + `ArticleList`; RSS, sitemap, llms.txt, robots; `elucidate new` / `check`; `create-elucidate`; GitHub Pages workflow with base-path support.
_Done when_ `npm create elucidate` → `npm run new` → push → live on GitHub Pages works end to end (tested with a project-path URL).

**M5 Polish and release.** Budgets enforced, Lighthouse check, print stylesheet, all docs written, final README and AGENTS.md, CHANGELOG, publish `0.1.0`.
_Done when_ every MUST in this spec is met and a fresh reader can go from README to a deployed article in under 10 minutes.

---

## 19. Roadmap (later; keep in `docs/roadmap.md`)

- Search (Pagefind).
- PDF export.
- DOI helpers: Crossref deposit XML from front matter; Zenodo/DataCite metadata.
- Full peer-review workflow: issue templates, PR previews, review checklist action.
- Comments (giscus).
- Jupyter notebook import.
- More citation styles (CSL), narrative citations (`@key` → "Lovelace et al. (2026)").
- Clickable equation terms (KaTeX `\htmlClass` / MathJax `\class`) with definitions.
- Auto-generated social images.
- JSON-LD `ScholarlyArticle`.
- Markdown/plain-text version of each article for readers and agents.
- Articles from separate repositories; large-data guidance and tooling.
- Shared author profiles and author pages.
- i18n.
- Migrating the markdown pipeline to Sätteri plugins when they cover math and our needs.
- `elucidate eject <Component>` to copy a structural component for overriding.
- "Use this template" mirror repo for the starter.

---

## 20. Verify at implementation time

These depend on fast-moving tools; check the current docs before building on them:

1. Astro 7: how to select the unified processor (`@astrojs/markdown-remark`, `markdown.processor: unified({ remarkPlugins, rehypePlugins })`), and whether `@astrojs/mdx` inherits it.
2. Writing to `file.data.astro.frontmatter` from **rehype** plugins and reading it via `remarkPluginFrontmatter` with the Content Layer API.
3. Named slots passed from MDX into Astro components (`slot="caption"`).
4. `astro-auto-import` compatibility with Astro 7 (or write the ~40-line equivalent).
5. Astro Fonts API status (stable vs experimental) versus `@fontsource`.
6. Injected routes vs user routes precedence (to implement the `home` mode collision error).
7. MathJax 4 server-side rendering for rehype (`@mathjax/src` 4.x) vs `rehype-mathjax`.
8. `rehype-citation` vs `@citation-js/*` (0.9.x) for least code meeting §6.3.
9. Popover API / CSS anchor positioning browser support (use JS positioning fallback if needed).
10. npm name availability for `astro-elucidate` and `create-elucidate` at publish time (both free on 2026‑11‑10), and npm trusted-publishing setup for the `@elucidatejs` org.

---

## 21. Maintainer tasks (manual; not for the coding agent)

These need organization or registry permissions. The agent should point to the relevant item when it becomes necessary instead of attempting it.

| When             | Task                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Before M0        | Create GitHub org `elucidatejs` (require 2FA) and repo `elucidatejs/elucidate` (public). Give Claude Code access.                                                                    |
| Before M0        | If you use Claude Code on the web: give its cloud environment browser access (see §21.1).                                                                                            |
| Before M0        | Create `elucidatejs/.github` with `profile/README.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and issue/PR templates (the agent can draft these as a PR to that repo if given access). |
| After M0 merges  | Protect `main`: require PRs and the CI check. Under Settings → Actions, allow workflows to create pull requests (needed by Changesets).                                              |
| Before M1 merges | Settings → Pages → Source: **GitHub Actions** (the live demo deploys from `main`).                                                                                                   |
| Before M5        | Create npm org `@elucidatejs` (require 2FA). Configure **trusted publishing** for `astro-elucidate` and `create-elucidate` from `elucidatejs/elucidate`'s `release.yml`.             |
| M5               | Review and merge the Changesets "Version Packages" PR to publish `0.1.0`.                                                                                                            |

### 21.1 Browser access for Claude Code cloud sessions

Cloud sessions include Node 22, pnpm and Docker, but not Playwright's browsers, and the default **Trusted** network level does not include Playwright's download hosts. In the cloud environment settings for this repo:

1. **Network access → Custom**, keep **"Also include default list of common package managers"** checked, and add:

   ```
   cdn.playwright.dev
   playwright.download.prss.microsoft.com
   playwright.azureedge.net
   ```
2. **Setup script** (cached between sessions; applies once M0 has added Playwright to the repo; if the script doesn't start inside the repo, replace the `cd` line with the repo path shown in a session):

   ```bash
   #!/bin/bash
   set -e
   cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
   corepack enable
   pnpm install --frozen-lockfile || pnpm install
   pnpm exec playwright install --with-deps chromium
   ```
3. Check in a new session by asking Claude to run `pnpm shots` and show one screenshot.

If the browser download still fails, Claude should report it in the PR and rely on the CI `screenshots` artifact; GitHub Actions runners always support Playwright.
