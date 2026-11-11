import type { RemarkPlugin } from '@astrojs/markdown-remark';

interface Options {
  /** Absolute path of `src/pages/`. */
  pagesDir: string;
  /** Import path of the layout to use. */
  layout: string;
}

/** Article layouts named in front matter (docs/spec.md §7.1), as opposed to layout import paths. */
const articleLayouts = ['article', 'bespoke'];

/**
 * Gives Markdown and MDX pages in `src/pages/` the Page layout unless they set `layout`.
 *
 * MDX treats any `layout` in front matter as a component to import and wrap the content in, so
 * an article's `layout: bespoke` is taken out here; the article route reads it from the
 * collection instead.
 */
export const remarkDefaultLayout: RemarkPlugin<[Options]> =
  ({ pagesDir, layout }) =>
  (_tree, file) => {
    const path = file.path ?? file.history[0];
    const astro = file.data.astro as { frontmatter?: Record<string, unknown> } | undefined;
    const current = astro?.frontmatter?.layout;
    if (astro?.frontmatter && typeof current === 'string' && articleLayouts.includes(current)) {
      delete astro.frontmatter.layout;
    }
    if (!path?.startsWith(pagesDir)) return;
    file.data.astro ??= {};
    const data = file.data.astro as { frontmatter?: Record<string, unknown> };
    data.frontmatter ??= {};
    data.frontmatter.layout ??= layout;
  };
