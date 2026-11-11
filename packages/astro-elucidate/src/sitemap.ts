import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import type { ElucidateConfig } from './config.ts';

/**
 * `@astrojs/sitemap` with the pages search engines should not list removed: articles in review,
 * the component overview, and files such as rss.xml (docs/spec.md §10.3).
 */
export function sitemapIntegration(config: ElucidateConfig, srcDir: URL) {
  const { pathname: base } = new URL(config.url);
  const prefix = `${base.replace(/\/+$/, '')}/`;
  let hidden: Set<string> | undefined;
  return sitemap({
    filter: (page) => {
      // Read once, when the build is done, so the list matches what was built.
      hidden ??= new Set([
        `${prefix}components/`,
        ...reviewSlugs(srcDir).map((slug) => `${prefix}${config.routes.articles}/${slug}/`),
      ]);
      const { pathname } = new URL(page);
      return pathname.endsWith('/') && !hidden.has(pathname);
    },
  });
}

/** Folder names of the articles whose front matter says `status: review`. */
export function reviewSlugs(srcDir: URL): string[] {
  const articles = new URL('articles/', srcDir);
  if (!existsSync(articles)) return [];
  return readdirSync(articles).filter((slug) =>
    ['md', 'mdx'].some((ext) => {
      const file = new URL(`${slug}/index.${ext}`, articles);
      if (!existsSync(file)) return false;
      const { frontmatter } = parseFrontmatter(readFileSync(file, 'utf8'));
      return frontmatter.status === 'review';
    }),
  );
}
