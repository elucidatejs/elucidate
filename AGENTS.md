# AGENTS.md

Source of truth for scope and decisions: [docs/spec.md](docs/spec.md). Read it before changing anything.

Elucidate is an Astro integration plus a starter site for publishing web-native scientific
articles. This file is a stub during v0.1; it becomes final in milestone M5.

## Repo map

```
packages/astro-elucidate/   the engine: Astro integration (ships TypeScript source, no build step)
packages/create-elucidate/  `npm create elucidate` (compiled to dist/ with tsc)
starter/                    the site template = demo site = e2e target
e2e/                        Playwright + axe tests against the built starter
scripts/shots.ts            screenshot script for visual review (not a test)
docs/                       spec.md, architecture.md (deviations live there), later topic docs
```

## Commands

```sh
pnpm install
pnpm dev          # starter dev server against the local packages
pnpm lint         # Biome (pnpm format to fix)
pnpm typecheck    # tsc for packages, astro check for the starter
pnpm test         # Vitest unit tests
pnpm build        # builds create-elucidate and the starter
pnpm e2e          # Playwright + axe; run pnpm build first
pnpm shots        # screenshots at 375/1440 px, light/dark, into .screenshots/
```

First Playwright run on a new machine: `pnpm exec playwright install chromium`.

## Working rules

- One branch and one pull request per milestone (docs/spec.md §18).
- PR description: what changed (≤ 10 bullets), the milestone's "Done when" checklist, deviations,
  screenshots for visual changes.
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

Arrives with M1–M3. Each needs its own file, a test fixture, a docs entry and an example on the
component overview page.
