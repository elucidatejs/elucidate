# Contributing

Elucidate is a pnpm workspace: the engine (`packages/astro-elucidate`), `npm create elucidate`
(`packages/create-elucidate`) and the starter site, which is also the demo and the test target.
Changes arrive as pull requests that the maintainer reviews and merges. Scope and decisions live
in [spec.md](spec.md); [AGENTS.md](../AGENTS.md) has the repository map and these rules in short.

## Set up

You need Node.js 22.23.4 or newer and pnpm 12 (`corepack enable` picks the version in
`package.json`).

```sh
pnpm install
pnpm exec playwright install chromium   # once, for e2e, screenshots and Lighthouse
pnpm dev                                # the starter at http://localhost:4321, on the local packages
```

## Checks

CI runs these in order on every pull request; run the ones your change touches before pushing.

| Command | What it checks |
|---|---|
| `pnpm lint` | Biome lint and format (`pnpm format` fixes what it can). |
| `pnpm typecheck` | `astro check` for the engine and the starter, `tsc` for `create-elucidate`. |
| `pnpm test` | Vitest: config and schemas, every markdown plugin, a customized site built end to end. |
| `pnpm build` | Builds `create-elucidate` and the starter. The next four need it. |
| `pnpm e2e` | Playwright and axe on the built starter: layouts at 375, 1024 and 1440 px in both themes, scholarly parts, overlays, feeds, print. |
| `pnpm budgets` | The performance budgets of [spec.md](spec.md) §13.3 on the example article: core JS ≤ 6 KB and CSS without math ≤ 25 KB (gzip), at most 2 fonts preloaded; pages without math, figures or overlays load no math CSS and no figure or overlay JS. |
| `pnpm lighthouse` | Lighthouse (mobile) ≥ 95 for Performance, Accessibility, Best Practices and SEO on the example article. The report is saved in `.lighthouse/`. |
| `pnpm shots` | Not a test: screenshots at 375 and 1440 px, light and dark, in `.screenshots/`. CI uploads them as the `screenshots` artifact. `pnpm shots -- <path>` takes one page. |
| `pnpm smoke` | A new site from the packed packages, as a user makes it: create, install, new, check and build under a base path, then every link. Needs the npm registry. |

## Pull requests

- One branch and one pull request per change; split one only past about 1,500 changed lines.
- Describe what changed in at most 10 bullets, list deviations from the spec, and add
  screenshots, light and dark, phone and desktop, for anything visual. Look at them first.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Add a changeset (`pnpm changeset`) when the public API ([spec.md](spec.md) §11.9) or the
  behavior of a published package changes, and update the docs it affects in the same pull request.
- When the spec is silent, take the simplest option and record it under "Deviations" in
  [architecture.md](architecture.md). Ideas from the [roadmap](roadmap.md) become issues labeled
  `idea` before anyone builds them.

## Releasing

Both packages always share one version (a fixed group in `.changeset/config.json`).

1. On a branch from `main`, run `pnpm changeset version`. It bumps both packages, writes their
   `CHANGELOG.md` files from the pending changesets and deletes them. Commit as
   `chore: version packages` and open a pull request titled "Version Packages".
2. The maintainer merges it. On `main`, `.github/workflows/release.yml` runs
   `changeset publish`, which publishes the versions npm does not have yet, and pushes the tags
   `astro-elucidate@<version>` and `create-elucidate@<version>`. `npm create elucidate` downloads
   the starter from the second tag, so a release is not usable until its tags exist.

Nothing is published while the version is `0.0.0`. To retry a failed release, re-run the workflow
from the Actions tab; versions already on npm are skipped.

### npm setup (maintainer, once)

npm lets you add a trusted publisher only to a package that exists, so the first release uses a
token and every later one uses trusted publishing, with provenance and no token.

1. Create the npm organization `elucidatejs`, with two-factor authentication required.
2. Create a granular access token that can publish new packages, with a short expiry, and add it
   to this repository as the Actions secret `NPM_TOKEN`.
3. Merge the "Version Packages" pull request for `0.1.0`; the release workflow publishes with the
   token. Then give the organization's team both packages, e.g.
   `npm access grant read-write elucidatejs:developers astro-elucidate`.
4. On npmjs.com, open each package's settings, add a trusted publisher for GitHub Actions with
   organization `elucidatejs`, repository `elucidate` and workflow `release.yml`, then disallow
   tokens for publishing.
5. Delete the `NPM_TOKEN` secret and revoke the token.
