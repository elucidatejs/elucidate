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
- **`starter/`** depends on `astro-elucidate` through `workspace:*`; `create-elucidate` will rewrite
  that to the published version (spec §15).

## Engine layout

`astro-elucidate/src/` is split by concern, one file each:

| Folder | Holds |
|---|---|
| `index.ts` | The integration: validates settings, sets `site`/`base`, Markdown, MDX, fonts and a Vite plugin, and injects routes. |
| `config.ts`, `schema/` | Zod schemas for `elucidate.config.ts` and front matter, and the `file → path` error formatter with "Did you mean" hints. |
| `content.ts` | The `articles` collection (one folder per article; the folder name is the slug). |
| `routes/` | Injected pages: index, article, tag, 404. |
| `layouts/` | `Base` (head, header, footer), `Article`, `Page`. |
| `components/` | Structural components (Header, Byline, TableOfContents, …). |
| `lib/` | Plain functions the routes share: article lists and status, URLs with the base path, dates, hero lookup. |
| `markdown/` | Remark plugins and the grayscale code theme. |
| `styles/` | Cascade-layered CSS: tokens, base, layout grid, chrome, components, article, contents. |
| `client/` | The two client scripts (theme toggle, contents scroll-spy), bundled and inlined by Astro. |

The integration hands the validated config and the optional `src/styles/theme.css` to the engine
through two virtual modules, `virtual:elucidate/config` and `virtual:elucidate/user-styles`. The
user stylesheet is imported after the engine CSS and has no layer, so it wins without `!important`.
Heroes are found with `import.meta.glob` over `src/articles/*/Hero.astro` and `hero.*` images.

## Dependencies

Runtime (`astro-elucidate`; `astro` is a peer dependency):

| Dependency | Why |
|---|---|
| `@astrojs/mdx` | Articles are MDX (spec §3). Added only if the site has not added it itself. |
| `@astrojs/markdown-remark` | Astro 7's default Markdown processor is not remark-based; `unified()` from this package selects the remark/rehype pipeline the engine's plugins need (spec §6.3, §20 #1). |
| `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify` | Render the front-matter `abstract` (Markdown) at build time. All four are already installed by `@astrojs/markdown-remark`, so they add no weight; listing them keeps the imports honest. |

Fonts (Inter, JetBrains Mono) are not npm dependencies: the Astro Fonts API downloads them from
Fontsource at build time and self-hosts them.

Development (workspace root):

| Dependency | Why |
|---|---|
| `@biomejs/biome` | Lint and format in one fast tool (spec §3). |
| `typescript` | Strict typechecking. Pinned to 6.x because `@astrojs/check` supports `^5 \|\| ^6` only. |
| `vitest` | Unit tests for config, schemas and markdown plugins. |
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
| `home: 'page'` in M4 (§18) | Route switch and both collision errors in M1 | They fall out of the §20 #6 check; the `ArticleList` component for page mode still comes in M4. |
| `release.yml` (§4.1) | Deferred to M5 | Nothing is published before M5. |
| Issue and PR templates (§18 M0) | Not added | They belong in the org-level `elucidatejs/.github` repo (§4.0). |

## Verify-at-implementation log (spec §20)

Checked on 2026-11-11. Items not listed yet are checked in the milestone that first depends on them.

- **10. npm names**: `astro-elucidate` and `create-elucidate` are unclaimed (`npm view` returns 404).
- **1. Markdown processor**: `astro@7.4.10` declares `@astrojs/markdown-remark ^7.3.0` as a peer
  dependency and depends on `@astrojs/markdown-satteri`; `@astrojs/mdx@8.1.4` declares both as
  peers. `markdown: { processor: unified({ remarkPlugins, rehypePlugins }) }` selects the unified
  pipeline, and MDX inherits it: the default-layout remark plugin runs for `.md` and `.mdx` pages
  (M1). Writing to the processor from rehype plugins (#2) is checked in M2.
- **5. Fonts**: the Astro Fonts API is stable (since Astro 6). The engine registers Inter and
  JetBrains Mono through `fontProviders.fontsource()` and renders them with `<Font>`; no
  `@fontsource/*` packages are needed. Only the Latin subsets of the two regular files are
  preloaded.
- **6. Route precedence**: rather than rely on how Astro ranks an injected route against a file in
  `src/pages/` with the same path, the integration checks the file system itself
  (`src/pages/index.*` and `404.*`): it throws a fix-it error for the `home` collision and skips
  its own 404 when the site has one.
