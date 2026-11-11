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

## 4. Pages and routes

Add pages in `src/pages/`; Markdown and MDX pages get the Page layout. Change the article URL
segment with `routes.articles`, and choose what the homepage shows with `home`.

## 5. Astro itself

The site is a normal Astro project: add integrations and Vite settings in `astro.config.ts`.

Your own components, structural overrides and the bespoke layout arrive in later v0.1 milestones.
