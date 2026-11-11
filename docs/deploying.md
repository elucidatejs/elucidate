# Deploying

An Elucidate site builds to static files in `dist/`, so any static host can serve it. The starter
publishes to GitHub Pages with the workflow it comes with. Wherever it goes, `url` in
`elucidate.config.ts` must be the address readers will use, including any path.

## GitHub Pages

1. Push the site to a GitHub repository, with the lockfile (`package-lock.json`, or pnpm's, yarn's
   or bun's) committed.
2. In the repository, open Settings → Pages and set Source to “GitHub Actions”.
3. Every push to `main` now runs `.github/workflows/deploy.yml`: it installs with the package
   manager of the lockfile, runs the build, and publishes `dist/`
   ([`withastro/action`](https://github.com/withastro/action) and
   [`actions/deploy-pages`](https://github.com/actions/deploy-pages)). The Actions tab shows each
   run and the address.

The address depends on the repository's name:

| Repository             | Address                          | `url` in `elucidate.config.ts`      |
| ---------------------- | -------------------------------- | ----------------------------------- |
| `lab-notes`            | `https://ada.github.io/lab-notes/` | `'https://ada.github.io/lab-notes'` |
| `ada.github.io`        | `https://ada.github.io/`         | `'https://ada.github.io'`           |

To publish from another branch, change `branches: [main]` in the workflow. To run it by hand, use
“Run workflow” on the Actions tab.

## Base path

When `url` has a path, such as `/lab-notes`, every page lives under it and Elucidate puts it in
every link it makes: the menu, the index, articles, tags, feeds, the sitemap and Markdown links
with root paths (`[About](/about/)` becomes `/lab-notes/about/`). Links you build in your own
components need it too: use `import.meta.env.BASE_URL`. To check a build under its path, run
`npm run build` and `npm run preview`, which serves it at the same path.

Search engines read `robots.txt` only at the root of a host, so on a project site the generated
`/lab-notes/robots.txt` is not used; submit `sitemap-index.xml` in the search engine's webmaster
tools instead.

## Custom domain

In Settings → Pages → Custom domain, enter the domain (e.g. `notes.example.org`), then add the DNS
records GitHub shows: a `CNAME` record pointing to `<user>.github.io` for a subdomain, or the
`A`/`AAAA` records for an apex domain. With the Actions workflow no `CNAME` file is needed. Then
set `url: 'https://notes.example.org'`, without a path, and push. Turn on “Enforce HTTPS” once the
certificate is ready.

## Other hosts

Each builds with `npm run build` and serves `dist/`; set `url` to the address the host gives you.

- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Vercel:** import the repository; the Astro preset fills in the build settings.
- **Cloudflare Pages:** framework preset Astro, build command `npm run build`, output `dist`.
- **Any static host:** run `npm run build` and upload the contents of `dist/`.
