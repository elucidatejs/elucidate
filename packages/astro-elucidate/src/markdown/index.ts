import type { RehypePlugins, RemarkPlugins } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import { type ElucidateConfig, siteAndBase } from '../config.ts';
import { builtInComponents, remarkAutoImport } from './auto-import.ts';
import { rehypeBaseLinks } from './base-links.ts';
import { remarkCitations } from './citations.ts';
import { remarkCrossref } from './crossref.ts';
import { remarkDefaultLayout } from './default-layout.ts';
import { rehypeFootnotes } from './footnotes.ts';
import { rehypeImages } from './images.ts';
import { rehypeMath, remarkDollarSigns } from './math.ts';
import { remarkMdxBlocks } from './mdx-blocks.ts';
import { remarkNumbering } from './numbering.ts';

/**
 * The Markdown pipeline (spec §6.3). Order matters:
 *
 * remark
 * 1. remark-math parses `$…$` and `$$…$$`; dollar-signs turns prices like `$5 and $10` back into text;
 *    mdx-blocks lifts one-line block components such as `<Aside>…</Aside>` out of their paragraph.
 * 2. numbering assigns numbers to sections, figures, tables and labeled equations, and collects
 *    the labels; it needs the math nodes.
 * 3. crossref turns `@fig:…` and friends into links; it needs the labels.
 * 4. citations numbers `[@key]` in order of first use.
 * 5. default-layout and auto-import only touch pages and MDX imports.
 *
 * rehype (after Astro's syntax highlighting, before its image handling and heading ids)
 * 1. math renders equations, so footnotes and sidenotes below contain rendered math.
 * 2. footnotes moves notes to the appendix data and beside their references.
 * 3. images checks alt text and sets lazy loading.
 * 4. base-links puts the site's base path in front of root paths such as `/about/`.
 */
export function markdownPlugins(
  config: ElucidateConfig,
  pagesDir: string,
  /** Components exported by the site's `src/components/index.ts`. */
  userComponents: string[] = [],
): { remarkPlugins: RemarkPlugins; rehypePlugins: RehypePlugins } {
  return {
    remarkPlugins: [
      remarkMath,
      remarkDollarSigns,
      remarkMdxBlocks,
      [remarkNumbering, { sections: config.numbering.sections }],
      remarkCrossref,
      remarkCitations,
      [remarkDefaultLayout, { pagesDir, layout: 'astro-elucidate/layouts/Page.astro' }],
      [
        remarkAutoImport,
        {
          sources: [
            { from: 'astro-elucidate/components', names: builtInComponents },
            { from: 'virtual:elucidate/user-components', names: userComponents },
          ],
        },
      ],
    ],
    rehypePlugins: [
      [rehypeMath, config.math],
      rehypeFootnotes,
      rehypeImages,
      [rehypeBaseLinks, { base: siteAndBase(config.url).base }],
    ],
  };
}
