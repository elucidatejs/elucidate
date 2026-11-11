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

## Dependencies

Runtime (`astro-elucidate`): none yet. `astro` is a peer dependency.

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
| Deploy the demo from `ci.yml` on `main` (§16) | Deferred to M1 | GitHub Pages must be switched to "GitHub Actions" first (§21), and M0 has no demo content. |
| `release.yml` (§4.1) | Deferred to M5 | Nothing is published before M5. |
| Issue and PR templates (§18 M0) | Not added | They belong in the org-level `elucidatejs/.github` repo (§4.0). |

## Verify-at-implementation log (spec §20)

Checked on 2026-11-11. Items not listed yet are checked in the milestone that first depends on them.

- **10. npm names**: `astro-elucidate` and `create-elucidate` are unclaimed (`npm view` returns 404).
- **1. Markdown processor**: `astro@7.4.10` declares `@astrojs/markdown-remark ^7.3.0` as a peer
  dependency and depends on `@astrojs/markdown-satteri`; `@astrojs/mdx@8.1.4` declares both as
  peers. How to select the unified processor is confirmed in M2.
