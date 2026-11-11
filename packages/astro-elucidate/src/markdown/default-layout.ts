import type { RemarkPlugin } from '@astrojs/markdown-remark';

interface Options {
  /** Absolute path of `src/pages/`. */
  pagesDir: string;
  /** Import path of the layout to use. */
  layout: string;
}

/** Gives Markdown and MDX pages in `src/pages/` the Page layout unless they set `layout`. */
export const remarkDefaultLayout: RemarkPlugin<[Options]> =
  ({ pagesDir, layout }) =>
  (_tree, file) => {
    const path = file.path ?? file.history[0];
    if (!path?.startsWith(pagesDir)) return;
    file.data.astro ??= {};
    const astro = file.data.astro as { frontmatter?: Record<string, unknown> };
    astro.frontmatter ??= {};
    astro.frontmatter.layout ??= layout;
  };
