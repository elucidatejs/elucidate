# astro-elucidate

## 0.1.0

### Minor Changes

- 20befe7: Articles and design: `defineConfig` with fix-it validation, the articles collection with a validated front-matter schema, Base/Article/Page layouts, header and footer, the title block with hero and byline, abstract, numbered table of contents, article index and tag pages, a 404 page, draft/review/published handling, design tokens, typography, dark mode and the layout grid.
- c9f0b76: Scholarly core: math with KaTeX or MathJax (shared macros, `\label` numbering, MathML), numbered figures and tables with the `Figure` component, cross-references (`@fig:`, `@tbl:`, `@eq:`, `@sec:`), citations from a BibTeX file with a Distill-style bibliography, footnotes as sidenotes, hover cards for citations and footnotes, a generated appendix with a citation box and BibTeX, the `Acknowledgments`, `Contributions` and `AppendixSection` components, and Highwire and Open Graph meta tags.
- 3da08e2: Interactivity and components: the data palette (`--el-data-*`, `--el-seq-*`, `--el-div-*` and
  `astro-elucidate/palette`), `Block`, `Aside`, `Note`, `Button` and `Overlay` (with
  `astro-elucidate/client`), control classes for interactive figures, a `fallback` image for
  `Figure`, components of your own from `src/components/index.ts`, overrides of structural
  components (props in `astro-elucidate/types`), `layout: bespoke`, and the `/components/` overview.
- b34bec3: Site features and the CLI: `home: 'page'` with the `ArticleList` component; `/rss.xml`,
  `/sitemap-index.xml`, `/llms.txt` and `/robots.txt`; root links in Markdown get the base path;
  the `elucidate new` and `elucidate check` commands; and `npm create elucidate`, which copies the
  starter with its GitHub Pages workflow and asks for the site title and URL.
- 5c2a484: Polish: a print stylesheet (one light column without the header, contents or sidenotes; interactive
  figures print their fallback image and references their address), labels for the checkboxes of
  task lists, and `$$…$$` alone in a paragraph as a display equation.
