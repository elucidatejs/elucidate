# How it works

Elucidate is a pnpm workspace with two published packages (`astro-elucidate`, `create-elucidate`)
and a starter site that doubles as the demo and the end-to-end test target. This file records how
the pieces fit, why each dependency exists, and where the implementation deviates from
[spec.md](spec.md). It grows with each milestone.

## Packages

- **`astro-elucidate`** is the Astro integration. It ships its TypeScript source with no build
  step, like Starlight: Astro compiles it through Vite, including from `node_modules` (checked by
  installing a packed tarball into a fresh site with npm). This keeps `.astro` components, styles
  and scripts as plain files and avoids a bundler.
- **`create-elucidate`** is a Node CLI, so it is compiled to `dist/` with `tsc`. Node does not
  strip types inside `node_modules`.
- **`starter/`** depends on `astro-elucidate` through `workspace:*`; `create-elucidate` rewrites
  that to the published version (spec §15).
- **The `elucidate` command** (`bin/elucidate.js`) is the one plain JavaScript file of the engine.
  It finds Vite through the site's own `astro` and loads `src/cli/index.ts` with Vite's
  `runnerImport`, the way Astro loads its config, so the CLI is TypeScript like the rest and needs
  no build step. The same loader reads the site's `elucidate.config.ts`.

## Engine layout

`astro-elucidate/src/` is split by concern, one file each:

| Folder | Holds |
|---|---|
| `index.ts` | The integration: validates settings, sets `site`/`base`, Markdown, MDX, fonts and Vite plugins, and injects routes. |
| `registry.ts`, `overrides.ts`, `showcase.ts` | The site's component registry, structural overrides, and the examples for `/components/` (below). |
| `palette.ts`, `types.ts` | `astro-elucidate/palette` (the data palette for scripts) and `astro-elucidate/types` (props of the overridable components). |
| `config.ts`, `schema/` | Zod schemas for `elucidate.config.ts` and front matter, and the `file → path` error formatter with "Did you mean" hints. |
| `content.ts` | The `articles` collection (one folder per article; the folder name is the slug). |
| `routes/` | Injected pages: index, article, tag, 404, the component overview, and the `rss.xml`, `llms.txt` and `robots.txt` endpoints. |
| `sitemap.ts` | `@astrojs/sitemap` with articles in review, `/components/` and non-page files filtered out. |
| `cli/` | `elucidate new` and `elucidate check` (§15), loaded by `bin/elucidate.js`. |
| `layouts/` | `Base` (head, header, footer), `Article`, `Bespoke`, `Page`. |
| `components/` | Structural components (Header, Byline, TableOfContents, Appendix, …), the author-facing ones exported from `astro-elucidate/components` (Figure, Block, Aside, Note, Button, Overlay, Acknowledgments, Contributions, AppendixSection), `blocks/` for bespoke articles, and `examples/` for the overview page. |
| `lib/` | Plain functions the routes share: article lists and status, URLs with the base path, dates, hero lookup, citation text and BibTeX, license and repository links, and the feed formats. |
| `markdown/` | The remark and rehype plugins (one file each, order in `index.ts`), the BibTeX loader and reference formatter, the KaTeX/MathJax renderers, and the grayscale code theme. |
| `styles/` | Cascade-layered CSS: tokens, base, layout grid, chrome, components, article, contents, figures, scholarly text (equations, citations, sidenotes, cards) and the appendix. |
| `client/` | Client scripts, bundled by Astro: theme toggle, contents scroll-spy, citation and footnote cards, copy buttons, overlays; `index.ts` is `astro-elucidate/client`. |

The integration hands the validated config and the optional `src/styles/theme.css` to the engine
through virtual modules, `virtual:elucidate/config` and `virtual:elucidate/user-styles`, plus
`virtual:elucidate/math-styles` for the math engine's CSS (a link to KaTeX's stylesheet, whose
fonts Vite emits, or MathJax's inline CSS); the article layout includes it only when the page has
math. The
user stylesheet is imported after the engine CSS and has no layer, so it wins without `!important`.
Heroes are found with `import.meta.glob` over `src/articles/*/Hero.astro` and `hero.*` images.

### Components, overrides and the bespoke layout (M3)

- **Registry.** At setup the integration reads `src/components/index.ts` as text and collects its
  export names (Elucidate needs them before Vite runs, to know what MDX may auto-import). The
  file is watched, so a change restarts the dev server. `virtual:elucidate/user-components`
  re-exports it, and the auto-import plugin imports used names from there.
- **Overrides.** A Vite `resolveId` hook sends imports of an overridden component to the site's
  file, but only when the import comes from inside the engine. Layouts and bespoke blocks need no
  changes, and a site's wrapper can still import the original by its package path.
- **Bespoke layout.** The article route stores the article, plugin data, hero and URL in
  `Astro.locals.elucidate` and passes the blocks (`ArticleTitle`, `Byline`, …) to the MDX content
  as its `components`. Each block reads the article from `Astro.locals` and renders the
  (overridable) structural component.
- **Overview page.** `virtual:elucidate/showcase` imports the engine's
  `components/examples/*.example.astro` and the site's `src/components/<Name>.example.mdx` files,
  with their sources as strings.

### Site features and the CLI (M4)

- **Feeds.** `lib/feeds.ts` turns the settings and the listed articles into RSS, `llms.txt` and
  `robots.txt`; the routes only add the site URL. A site's own `public/<file>` or
  `src/pages/<file>.ts` wins, checked on the file system like `404`.
- **Sitemap.** The filter runs when the build is done and reads `status: review` from the articles'
  front matter then, since the collection is not available to integrations.
- **`elucidate check`** runs what a build would: the settings, overrides and registry checks of the
  integration, the article schema, and each article through the same remark and rehype plugins
  (`markdownPlugins`) with `remark-mdx` and `remark-gfm`, without Astro's syntax highlighting and
  image steps. If that passes, it runs `astro check` for the types.
- **`create-elucidate`** downloads `starter/` at the tag `create-elucidate@<its version>` with
  giget, then rewrites `package.json` (name, `astro-elucidate` range) and four lines of
  `elucidate.config.ts` (title, url, description, repository). Changesets keeps both packages at
  the same version (`fixed`), so the tag and the range match.
- **`pnpm smoke`** packs both packages and takes the whole path a new user takes: `npm exec` the
  packed `create-elucidate`, `npm install` with the packed engine, `npm run new`, `check` and
  `build` for a site at `https://ada.github.io/lab-notes`, then serves `dist/` under `/lab-notes/`
  only, as GitHub Pages does, and follows every link from the homepage. CI runs it.

## Dependencies

Runtime (`astro-elucidate`; `astro` is a peer dependency):

| Dependency | Why |
|---|---|
| `@astrojs/mdx` | Articles are MDX (spec §3). Added only if the site has not added it itself. |
| `@astrojs/markdown-remark` | Astro 7's default Markdown processor is not remark-based; `unified()` from this package selects the remark/rehype pipeline the engine's plugins need (spec §6.3, §20 #1). |
| `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify` | Render the front-matter `abstract` (Markdown) at build time. All four are already installed by `@astrojs/markdown-remark`, so they add no weight; listing them keeps the imports honest. |
| `remark-math`, `katex` | Parse `$…$`/`$$…$$` and render them at build time with MathML (spec §6.3). KaTeX is the default engine. |
| `@citation-js/core`, `@citation-js/plugin-bibtex` | Parse BibTeX into CSL-JSON (spec §6.3, §20 #8). The Distill-style formatting is our own ~60 lines, so no citeproc or CSL styles are needed. |
| `github-slugger` | Section slugs for cross-references and the contents, the same algorithm as Astro's heading ids. |
| `hast-util-from-html`, `hast-util-to-html` | Insert the rendered math into the tree; export footnote HTML to the appendix. Both already come with `@astrojs/markdown-remark`. |
| `mdast-util-to-string`, `unist-util-visit`, `vfile` | Tree helpers for the plugins; already installed by the unified stack. |
| `@types/hast`, `@types/mdast`, `@types/unist` | The engine ships TypeScript source, so the types its plugins use are dependencies. All three already come with the packages above. |
| `@astrojs/sitemap` | `/sitemap-index.xml` (spec §4.2, §10.3). Added only if the site has not added it itself. |
| `remark-mdx`, `remark-gfm` | `elucidate check` parses MDX and GitHub-flavored Markdown as the build does. Both already come with `@astrojs/mdx` and `@astrojs/markdown-remark`. |

`create-elucidate` depends on `giget` (spec §15), which downloads a folder of a tagged GitHub
release and has no dependencies of its own.

Optional peer dependency: `@mathjax/src` 4 for `math.engine: 'mathjax'`. It is loaded only when
selected, with a fix-it error if it is missing, so KaTeX sites don't install it.

Fonts (Inter, JetBrains Mono) are not npm dependencies: the Astro Fonts API downloads them from
Fontsource at build time and self-hosts them.

Development (workspace root):

| Dependency | Why |
|---|---|
| `@biomejs/biome` | Lint and format in one fast tool (spec §3). |
| `typescript` | Strict typechecking. Pinned to 6.x because `@astrojs/check` supports `^5 \|\| ^6` only. |
| `vitest` | Unit tests for config, schemas and markdown plugins. |
| `@mathjax/src` (engine dev) | Both math engines are tested. |
| `@playwright/test`, `@axe-core/playwright` | E2E, accessibility checks and `pnpm shots`. |
| `@changesets/cli` | Versioning and changelogs for the two published packages. |
| `@types/node` | Types for Node APIs in tests, scripts and the CLI. |

Starter: `astro`, `astro-elucidate`, plus `@astrojs/check` and `typescript` for `astro check`.

## Deviations from the spec

| Spec | Implementation | Why |
|---|---|---|
| Node ≥ 22 (§3) | Node ≥ 22.23.4 | Astro 7.4.10 requires it. |
| pnpm (§3) | pnpm 12, with a `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml` | pnpm 12 delays very new releases by default and wrote this list for packages published in the last day (Astro 7.4.10 and its helpers). Entries can be dropped once those versions age. |
| Biome lints and formats everything | Markdown, `pnpm-workspace.yaml` and `pnpm-lock.yaml` are excluded | Biome 2.6 formats Markdown and would rewrite `docs/spec.md`; pnpm rewrites its own files with its own quoting. |
| `astro preview` in scripts | `astro preview --ignore-lock` | Astro 7 moves the preview server to the background when it detects a coding agent; the flag keeps it in the foreground for Playwright and `pnpm shots`. |
| Deploy the demo from `ci.yml` on `main` (§16) | A separate `deploy` job that runs only on pushes to `main` | Pull request checks stay green before Pages is switched to "GitHub Actions" (§21). |
| Styles in `tokens`, `base`, `components`, `article` files (§6.5) | Also `layout.css` (the named-line grid), `chrome.css` (header, footer) and `toc.css` | Keeps each file near 200 lines with one concern. |
| Colors as light and dark token sets (§12.3) | One set, each color written with `light-dark()` | Dark mode follows the system with no JavaScript; the toggle only sets `color-scheme`. `data-theme` is still always set, so user CSS can target it. |
| Header gains its background on scroll (§12.6) | A scroll-driven CSS animation, with a solid header where unsupported | No scroll listener. |
| Table of contents: floating at ≥ 1280 px, folded below (§9.2) | Rendered twice (a `<details>` under the byline and a margin column), with CSS showing one | Each works without JavaScript; the scroll-spy script only adds `aria-current`. |
| Framework components as heroes (`Hero.svelte`, `Hero.tsx`, §7.4) | Only `Hero.astro` and image files are found by convention; a framework component is rendered from `Hero.astro` | Globbing every framework extension would need each integration installed; one line in `Hero.astro` does the same. |
| `--el-font-serif` (§12.2) | A token with a fallback stack; the font is not registered | Registering it would download it on every build for an optional style. `docs/design.md` says how to load it. |
| Typecheck with `tsc` | `astro check` for `astro-elucidate` too | The engine imports `.astro` files, which `tsc` cannot resolve. |
| Features by milestone (§18) | The config and front-matter schemas accept every v0.1 field now; fields for later milestones are validated but unused | Sites written today keep working as features land. The docs say which fields take effect later. |
| `home: 'page'` in M4 (§18) | Route switch and both collision errors in M1 | They fall out of the §20 #6 check; `ArticleList` came in M4. |
| Index title with `home: 'page'` (§10.1) | The label of the `nav` item that links to the index, else "Articles"; no intro | The site title and description belong to the homepage then. |
| "All internal links MUST respect `base`" (§5) | Also Markdown links and images with a root path (`markdown/base-links.ts`); JSX in MDX is left alone | Authors write `/about/` as they would anywhere; a base path should not change their text. |
| `elucidate check` (§15) | Checks every article, drafts included, and stops at the first error in each; type errors come from `astro check` only when the rest passes | One error per article is what a build shows; running `astro check` first would repeat the front-matter errors. |
| `create-elucidate` options (§15) | `--title`, `--url` and `--yes` for use without a terminal, and `--template` for a local starter folder | The smoke test and CI need it without prompts, and before the first release there is no tag to download. Without a URL, `https://example.github.io/<folder>` stands in and no repository is set. |
| Starter README and AGENTS.md (§17.2, §17.3) | Written in M4 | `create-elucidate` copies them into every new site. |
| Done when: "push → live on GitHub Pages" (§18 M4) | `pnpm smoke` covers everything up to the push, under a project path; the push itself is the maintainer's check | Creating repositories is outside what the coding agent may do. |
| `release.yml` (§4.1) | Deferred to M5 | Nothing is published before M5. |
| Changesets opens the "Version Packages" PR from Actions (§16, §21) | `release.yml` will only publish (`changeset publish` skips versions already on npm); the version bump is a normal PR made with `pnpm changeset version` | The repository setting "Allow GitHub Actions to create and approve pull requests" stays off, so no workflow can open or approve pull requests. |
| Issue and PR templates (§18 M0) | Not added | They belong in the org-level `elucidatejs/.github` repo (§4.0). |
| Pipeline order in §6.3 (footnotes, then math) | rehype math runs before footnotes | Footnotes copied into the margin and the appendix then contain rendered math. The order is documented in `src/markdown/index.ts`. |
| `rehype-katex` or a MathJax equivalent (§6.3) | One `math` plugin over both engines: KaTeX's `renderToString` and MathJax 4's own API (`@mathjax/src`: TeX → SVG with assistive MathML) | `rehype-mathjax` 7 still uses MathJax 3; one plugin gives both engines the same equation wrapper, labels and file:line errors. |
| — | An extra remark step, `remarkDollarSigns`, after remark-math | remark-math reads `$5 and $10` as math; the step applies Pandoc's rule (no space inside the dollars, no digit after the closing one) and turns such spans back into text. |
| Display equations | Rendered in `div.el-equation` with `tabindex="0"` | Long equations scroll sideways on phones, and axe requires scrollable regions to be reachable by keyboard; Astro's code blocks do the same. |
| `figures-images` plugin: alt, lazy loading, intrinsic sizes (§6.3) | `images.ts` warns on empty alt and sets `loading`/`decoding`; sizes come from Astro's image pipeline | Astro already writes `width`/`height` for local images, which it processes after the rehype plugins. |
| `PluginData.references` (§6.4) | Each reference also has `meta`, the content of its `citation_reference` tag | The head needs it and only the bibliography plugin knows the fields. |
| Auto-import of the user component registry (§6.3) | The registry's export names are read from the file's text | The names are needed before Vite runs. `export * from` cannot be read this way, so it is an error with a fix-it; lowercase names are an error because MDX treats them as HTML. |
| `layout` front matter (§7.1) | `layout: article` and `layout: bespoke` are removed from the front matter MDX sees | MDX treats any `layout` as a component to import. The collection keeps the field, and the route reads it there. |
| `header: false` (§9.4) | A front-matter field `header` (default `true`), used by bespoke articles | §9.4 names it but §7.1 does not list it. |
| Bespoke layout (§9.4) | No footer either; content is not wrapped in the prose grid | §9.4 lists only Head, Header and the content. Authors can use `<div class="el-prose el-grid">` for Elucidate's typography. |
| `client/overlay.ts` behavior (§8.6) | Opening pushes a history entry, so Back closes the overlay; links to `#id` open it; `dismissible={false}` keeps Esc working | A hash that opens a view should behave like navigation; Esc stays for keyboard users (WCAG 2.1.2). |
| `palette.ts` in `src/` (§4.1) | Also `types.ts` there, and `client/index.ts` for `astro-elucidate/client` | Each public export has one file. |
| Figure `fallback` (§8.3) | Rendered with empty `alt` | It is shown only in print and without JavaScript, next to the caption and the description, which say what it shows. |
| Margin figures (`width="margin"`) | A zero-height box in the text column whose parts hang into the margin | Grid items cannot float; the M2 float rule had no effect. `Aside` uses the same technique. |
| Single-line block components | `<Aside>…</Aside>` on one line is lifted out of its paragraph (`markdown/mdx-blocks.ts`) | MDX parses it as inline content of a `<p>`, which browsers split around the block. |
| Data palette values (§12.4) | Okabe–Ito hues re-stepped per mode and reordered (blue, orange, green, violet, vermillion, sky blue, olive, pink); yellow and black are replaced by olive and violet | Pure Okabe–Ito yellow and sky blue fall below 3:1 on white and black is the text color. Values were checked with a palette validator for contrast and simulated protanopia and deuteranopia; see `docs/design.md`. |
| Showcase in e2e (§10.5) | The component overview is tested on the dev server (a second Playwright project) | With `showcase: 'dev'`, the production build has no `/components/` page. |
| §12.6 conformance fixed in M3 | Appendix band on `--el-surface` at full width, "Cite this article", COPY/COPIED text controls with a live region, citation card on the surface color at 360px without a shadow | M2 had drifted from §12.6 on these points. |
| Popovers (§8.4, §9) | One shared card, `#el-hovercard`, placed inside `<main>` | Fewer elements than one popover per citation; inside the main landmark so axe's "region" rule passes and screen reader users find it with the content. |
| All engine CSS in cascade layers (§6.5) | Two math rules in `scholarly.css` are unlayered: the equation margin and the phone position of KaTeX's equation number | KaTeX's and MathJax's own CSS is unlayered and would win over any layer. User CSS loads later, so it still wins at the same specificity. |
| Styles and components (§6.5) | Also `figure.css`, `scholarly.css` and `appendix.css`, and components `Appendix`, `ArticleMeta`, `MathStyles`, `HoverCards` | One concern per file, as above. |

## Verify-at-implementation log (spec §20)

Checked on 2026-11-11. Items not listed yet are checked in the milestone that first depends on them.

- **10. npm names**: `astro-elucidate` and `create-elucidate` are unclaimed (`npm view` returns 404).
- **1. Markdown processor**: `astro@7.4.10` declares `@astrojs/markdown-remark ^7.3.0` as a peer
  dependency and depends on `@astrojs/markdown-satteri`; `@astrojs/mdx@8.1.4` declares both as
  peers. `markdown: { processor: unified({ remarkPlugins, rehypePlugins }) }` selects the unified
  pipeline, and MDX inherits it: the default-layout remark plugin runs for `.md` and `.mdx` pages
  (M1).
- **5. Fonts**: the Astro Fonts API is stable (since Astro 6). The engine registers Inter and
  JetBrains Mono through `fontProviders.fontsource()` and renders them with `<Font>`; no
  `@fontsource/*` packages are needed. Only the Latin subsets of the two regular files are
  preloaded.
- **6. Route precedence**: rather than rely on how Astro ranks an injected route against a file in
  `src/pages/` with the same path, the integration checks the file system itself
  (`src/pages/index.*` and `404.*`): it throws a fix-it error for the `home` collision and skips
  its own 404 when the site has one.
- **2. Plugin data from rehype** (M2): data written to `file.data.astro.frontmatter.elucidate` by
  remark and by rehype plugins (headings and references from remark, `hasMath` and footnotes from
  rehype) reaches `remarkPluginFrontmatter` after `render(entry)` for `.mdx` entries of a Content
  Layer collection.
- **3. Named slots from MDX** (M2): `<Fragment slot="caption">…</Fragment>` as a direct child of
  `<Figure>` in MDX fills `<slot name="caption" />`, with math, citations and cross-references
  inside processed by the plugins. The tour article's table uses it.
- **Sitemap and the CLI loader** (M4, not a §20 item): `@astrojs/sitemap` 3.7 skips `404`/`500` itself and
  runs its `filter` on full URLs after the build. Node 22 does not strip types under
  `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), hence the CLI's Vite loader;
  `vite.runnerImport` exists in the Vite 8 that Astro 7.4 uses.
- **4. Auto-import** (M2): `astro-auto-import` 0.6.0 supports Astro 7 (`peerDependencies: astro
  ^7.2.4`), but it is a separate integration and imports every listed component into every file.
  `markdown/auto-import.ts` is the ~40-line equivalent: it adds one `import` for the built-in
  components a file actually uses, unless the file imports a component of that name itself.
- **7. MathJax 4** (M2): `rehype-mathjax` 7.1.0 depends on `mathjax-full` 3. `@mathjax/src` 4.1
  renders on the server through its own API (lite adaptor, TeX input with `base`, `ams`,
  `newcommand`, `configmacros`, SVG output with `fontCache: 'none'`, assistive MathML). Plugins run
  after Vite's module runner has closed, so the engine loads MathJax with `createRequire` (its CJS
  build) rather than `import()`.
- **8. Citations** (M2): `@citation-js/core` and `@citation-js/plugin-bibtex` 0.9.0 parse BibTeX to
  CSL-JSON synchronously. `rehype-citation` 2.3 formats through citeproc and CSL styles; the fixed
  Distill style, numbering in order of first use and file:line errors with the closest key took
  less code with citation-js and a small formatter of our own.
- **9. Popover API** (M2): supported in all current browsers since 2024. CSS anchor positioning
  arrived later, so the card is positioned with a few lines of JavaScript and flips above the link
  when there is no room below. Without the Popover API, the links jump to the appendix.
