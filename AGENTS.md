# AGENTS.md

Source of truth for scope and decisions: [docs/spec.md](docs/spec.md). Read it before changing anything.

Elucidate is an Astro integration plus a starter site for publishing web-native scientific
articles in the spirit of Distill. docs/contributing.md has the checks and the release steps.

## Repo map

```
packages/astro-elucidate/   the engine: Astro integration (ships TypeScript source, no build step)
  src/index.ts              integration: settings, Markdown, fonts, virtual modules, routes
  src/{config.ts,schema/}   config and front-matter schemas, fix-it error formatting
  src/{routes,layouts,components}/  injected pages, layouts, structural components
  src/{lib,markdown,client,styles}/ shared helpers, remark/rehype plugins, client scripts, layered CSS
  src/cli/, bin/            `elucidate new` / `check`; bin/elucidate.js loads the TS through Vite
  test/fixtures/            articles and .bib files for the plugin tests; site/ is a whole site
packages/create-elucidate/  `npm create elucidate` (compiled to dist/ with tsc)
starter/                    the site template = demo site = e2e target (example articles in src/articles/)
e2e/                        Playwright + axe tests against the built starter
scripts/                    shots, smoke (a new site from the packed packages), budgets, lighthouse
.github/workflows/          ci.yml (checks, demo deploy), release.yml (npm publish and tags)
docs/                       spec.md, architecture.md (deviations live there), topic docs
```

## Commands

```sh
pnpm install
pnpm dev          # starter dev server against the local packages
pnpm lint         # Biome (pnpm format to fix)
pnpm typecheck    # astro check for the engine, elucidate check for the starter, tsc for create-elucidate
pnpm test         # Vitest unit tests
pnpm build        # builds create-elucidate and the starter
pnpm e2e          # Playwright + axe; run pnpm build first
pnpm budgets      # JS, CSS and font budgets of the example article; after pnpm build
pnpm lighthouse   # Lighthouse (mobile) ≥ 95 on the example article; after pnpm build
pnpm shots        # screenshots at 375/1440 px, light/dark, into .screenshots/
pnpm smoke        # a new site from the packed packages, end to end (needs the npm registry)
```

First Playwright run on a new machine: `pnpm exec playwright install chromium`.

## Working rules

- One branch and one pull request per change (per milestone during v0.1, docs/spec.md §18).
- PR description: what changed (≤ 10 bullets), deviations, screenshots for visual changes.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Add a changeset (`pnpm changeset`) when a published package's public API or behavior changes.
- Done means: CI green, new behavior tested, affected docs updated, budgets met.
- Look at what you build: run `pnpm shots` for visual changes and open the images.
- The maintainer reviews and merges. Never merge your own PR, push to `main`, publish to npm or
  change repository settings.
- When the spec is silent, pick the simplest option and record it under "Deviations" in
  docs/architecture.md. Out-of-scope ideas (§19) become issues labeled `idea`.

## Principles

- Lightweight is the mantra: code, dependencies, docs and pages.
- Necessary only: every feature, file, dependency and option serves a v0.1 goal.
- Defaults and conventions over configuration.
- Small files (~200 lines), one concern each; comments explain why, not what.
- Few dependencies, each justified in docs/architecture.md; prefer platform features.
- Zero JS by default: pages only load the scripts their features need.

## Public API

Config schema, front-matter schema, `--el-*` tokens, built-in component names and props, override
names and props, `astro-elucidate/{config,content,components,layouts,client,palette,types}` exports
and the MDX syntax (docs/spec.md §11.9). Changes there need a changeset and docs.

## Adding a component or markdown plugin

- Authoring component: `src/components/<Name>.astro`, exported from `components/index.ts` and
  listed in `builtInComponents` (`markdown/auto-import.ts`), and in `blockComponents`
  (`markdown/mdx-blocks.ts`) if it renders a block. Add `components/examples/<Name>.example.astro`
  and a line in `showcase.ts` for `/components/`, and a section in `docs/components.md`.
- Markdown plugin: one file in `src/markdown/`, its place in the order in `markdown/index.ts`, and
  tests through `test/markdown-helpers.ts`.
- `test/site.test.ts` builds `test/fixtures/site/`, a customized site, end to end.
