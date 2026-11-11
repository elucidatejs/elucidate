# Customizing

You customize an Elucidate site inside your own repository, never by editing the package. Most
sites need only the first three layers: settings, theme tokens and custom CSS.

## 1. Settings

`elucidate.config.ts`; see [configuration.md](configuration.md).

## 2. Theme tokens

Override any `--el-*` token in `src/styles/theme.css`:

```css
:root {
  --el-font-sans: 'Geist', system-ui, sans-serif;
  --el-width-text: 700px;
}
:root[data-theme='dark'] {
  --el-bg: #000;
}
```

`data-theme` is always set to the theme in use (`light` or `dark`), whether it comes from the
system setting or the theme toggle. The full token list is in [design.md](design.md).

## 3. Custom CSS

Add any CSS to the same file. Elucidate's styles live in cascade layers (`elucidate.*`) and
`theme.css` is loaded last without a layer, so your rules always win without `!important`. Engine
class names start with `el-`.

## 4. Your own components

Put components in `src/components/` and export them from `src/components/index.ts`:

```ts
export { default as Callout } from './Callout.astro';
export { default as Heatmap } from './Heatmap.svelte';
```

They work in every MDX file without an import. Name each export (Elucidate reads the names before
the site builds, so `export * from …` is not supported) and start it with a capital letter. A name
that clashes with a built-in component, or with a block of the bespoke layout, is an error.

During development, `/components/` lists them next to the built-in components. Add an example
next to a component, named `<Name>.example.mdx`, and the page shows it rendered, with its source:

```mdx
<Callout tone="warning">Check the units before you compare these numbers.</Callout>
```

Changes to `index.ts` restart the dev server.

## 5. Interactive figures

Any `.astro` component with a `<script>` works as an interactive figure, without a framework; so
does any framework Astro supports (`npx astro add svelte`). Wrap it in a `Figure` with a
`description` and, ideally, a `fallback` image, and take colors from the data palette so it
follows the theme and dark mode. See [components.md](components.md#the-data-palette). The example
article's `figures/MomentumExplorer.astro` is a complete example: palette colors, the control
classes, a tooltip that works over an overlay, and keyboard access.

Keep large data files in `public/` or the article folder; beyond about 10 MB, use Git LFS or
object storage.

## 6. Overrides

Replace a structural component with your own in `elucidate.config.ts`:

```ts
overrides: {
  Byline: './src/overrides/Byline.astro',
}
```

You can override `Head`, `Header`, `Footer`, `ArticleHero`, `Byline`, `TableOfContents`,
`Appendix` and `ArticleCard`. Paths are relative to the project root. An override receives the
same props as the original; their types are exported as `HeadProps`, `BylineProps` and so on:

```astro
---
// src/overrides/Byline.astro: wraps the original instead of replacing it.
import Original from 'astro-elucidate/components/Byline.astro';
import type { BylineProps } from 'astro-elucidate/types';

type Props = BylineProps;
---

<div class="my-byline"><Original {...Astro.props} /></div>
```

Importing the original from `astro-elucidate/components/<Name>.astro` always gives the built-in
one, so a wrapper does not import itself.

## 7. Per article

An article folder can hold its own CSS (`import './style.css'` at the top of `index.mdx`), its own
components, a `Hero.astro`, and with `layout: bespoke` a design of its own: the page then has
only the site header and the content, and the article places the title, byline, abstract,
contents and appendix itself (see [components.md](components.md#blocks-for-a-bespoke-article)):

```mdx
---
title: An essay
layout: bespoke
header: false   # leaves out the site header too
…
---

<ArticleTitle />
<Byline />

<div class="el-prose el-grid">
  The text, with Elucidate's typography, or with your own.
</div>

<Appendix />
```

## 8. Pages and routes

Add pages in `src/pages/`; Markdown and MDX pages get the Page layout. Change the article URL
segment with `routes.articles`, and choose what the homepage shows with `home`: with `'page'`, your
`src/pages/index.mdx` is the homepage and can show the latest articles with `<ArticleList />`
([writing.md](writing.md#a-homepage-of-your-own)). A page of your own at
`src/pages/components.astro` takes the place of the component overview, and files such as
`public/robots.txt` take the place of the generated ones
([configuration.md](configuration.md#generated-files)).

## 9. Astro itself

The site is a normal Astro project: add integrations and Vite settings in `astro.config.ts`.
