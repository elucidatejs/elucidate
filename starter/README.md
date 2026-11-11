# Elucidate site

A publication of web-native scientific articles, built with
[Elucidate](https://github.com/elucidatejs/elucidate) and [Astro](https://astro.build).

## Commands

| Command                          | What it does                                               |
| -------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                    | Preview at http://localhost:4321, drafts included.         |
| `npm run new -- "Article title"` | Start `src/articles/<slug>/index.mdx` from a template.     |
| `npm run check`                  | Find broken settings, front matter, references and types.  |
| `npm run build`                  | Build the site into `dist/`; drafts are left out.          |
| `npm run preview`                | Serve the build.                                           |

## Where things live

```
elucidate.config.ts      title, URL, menu and other settings
src/articles/<slug>/     one folder per article: index.mdx, references.bib, figures/
src/pages/               other pages, such as about.mdx
src/components/index.ts  your own components, usable in every article
src/styles/theme.css     colors, fonts and your own CSS
public/                  files served as they are, such as favicon.svg
```

## Deploy

Push to GitHub and set Settings → Pages → Source to “GitHub Actions”; `.github/workflows/deploy.yml`
publishes every push to `main`. Other hosts: build and upload `dist/`.

Guides for writing, components, customizing and deploying:
[elucidate/docs](https://github.com/elucidatejs/elucidate/tree/main/docs).
