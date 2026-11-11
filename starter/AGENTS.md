# AGENTS.md

This is a publication of scientific articles built with Elucidate, an Astro integration
(`astro-elucidate`). Articles are MDX files; Elucidate adds numbering, citations, figures and layout.

## Files

```
elucidate.config.ts      site settings: title, url (with its base path), nav, math macros, overrides
src/articles/<slug>/     one folder per article; the folder name is the URL slug
  index.mdx              front matter + text
  references.bib         citations, found automatically
  Hero.astro, figures/   optional title visual; images, data and figure components
src/pages/               other pages; *.mdx uses the Page layout by default
src/components/index.ts  registry: components exported here work in every MDX file without import
src/styles/theme.css     token overrides (--el-*) and custom CSS
.github/workflows/       deploy.yml publishes to GitHub Pages on push to main
```

## Recipes

- **Add an article:** `npm run new -- "Title"`, then edit `src/articles/<slug>/index.mdx`. It is a
  draft (`status: draft`) until you set `status: published`.
- **Add a figure:** put the image in the article's `figures/` and wrap it:
  `<Figure id="fig:name" caption="…">![Alt text](./figures/name.svg)</Figure>`; refer to it
  with `@fig:name`.
- **Add an interactive figure:** write an Astro component in `figures/` with a `<script>` (plain
  TypeScript is enough), import it in the MDX and wrap it in
  `<Figure id="fig:…" description="…" fallback={stillImage}>`. Colors come from
  `astro-elucidate/palette` (`palette()`, `onThemeChange()`) or the `--el-data-*` tokens.
- **Register a component for every article:** export it from `src/components/index.ts`, and add a
  `<Name>.example.mdx` next to it to show it on `/components/`.
- **Change colors or fonts:** override `--el-*` tokens in `src/styles/theme.css`.
- **Override a structural component** (Header, Footer, Byline, …): create
  `src/overrides/Byline.astro` with props typed from `astro-elucidate/types`, and set
  `overrides: { Byline: './src/overrides/Byline.astro' }` in `elucidate.config.ts`.
- **Add a page:** `src/pages/<name>.mdx` with `title` in its front matter; link it from `nav`.

## Rules

- Never edit `node_modules/astro-elucidate`; customize with settings, tokens, CSS, your own
  components and overrides, in that order of preference.
- Run `npm run check` before finishing; it must pass. Then `npm run build`.
- Every image needs alt text; every interactive figure needs a `description` and a `fallback`.
- Use the data palette for figure colors, never hard-coded colors.
- In Markdown, link to pages with root paths such as `/about/`; Elucidate adds the base path. In
  components, build internal URLs with `import.meta.env.BASE_URL`.

## Where to look

- `src/articles/a-tour-of-elucidate/` uses every feature; copy from it.
- `/components/` on `npm run dev` shows every component with its source.
- Engine docs: https://github.com/elucidatejs/elucidate/tree/main/docs
