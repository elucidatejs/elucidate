# Getting started

From nothing to a published article: create a site, write an article, check it, and put it on
GitHub Pages. You need Node.js 22.23.4 or newer and, to publish, a GitHub account.

## 1. Create the site

```sh
npm create elucidate@latest lab-notes
```

It asks for the site title and its public URL; press Enter to keep the suggestion and change it
later in `elucidate.config.ts`. For GitHub Pages the URL is `https://<user>.github.io/<repository>`,
so name the repository after the folder. Then:

```sh
cd lab-notes
npm install
npm run dev
```

The dev server prints the address, e.g. `http://localhost:4321/lab-notes/`. The site comes with two
example articles: `a-tour-of-elucidate` uses every feature, `hello-world` is the shortest useful
article. Keep them for reference while you write, and delete their folders when you no longer need
them.

Options for scripts and CI: `--title "Lab Notes"`, `--url https://ada.github.io/lab-notes`, and
`--yes` to take the defaults without asking (`npm create elucidate@latest lab-notes -- --yes`).

## 2. Write an article

```sh
npm run new -- "Momentum, gently"
```

This creates `src/articles/momentum-gently/index.mdx` as a draft and prints its URL. Write in
Markdown; [writing.md](writing.md) covers math, figures, citations, footnotes and the rest, and
`/components/` on the dev server shows every component with its source. When it is ready, set
`status: published` in the front matter.

## 3. Check it

```sh
npm run check
```

This reports what a build would reject, each with its file, line and a fix: settings, front
matter, unknown cross-references and citations, TeX and MDX errors, and type errors. `npm run build`
then builds the site into `dist/`; drafts are left out.

## 4. Publish

Create an empty repository on GitHub with the folder's name and push:

```sh
git init && git add . && git commit -m "First article"
git remote add origin https://github.com/<user>/lab-notes.git
git push -u origin main
```

In the repository, open Settings → Pages and set Source to “GitHub Actions”. The site's
`.github/workflows/deploy.yml` builds and publishes every push to `main`; the first run takes a
minute or two, then the site is at `https://<user>.github.io/lab-notes/`. Other hosts and custom
domains: [deploying.md](deploying.md).
