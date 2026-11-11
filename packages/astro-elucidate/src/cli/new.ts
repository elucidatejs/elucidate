import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteAndBase } from '../config.ts';
import { slugify } from '../lib/slugify.ts';
import { type Context, loadSettings, script } from './site.ts';

/** The writer's calendar day, e.g. 2026-11-11. */
const localDay = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('-');

/** The new article: valid front matter, a draft, and pointers to everything else. */
export function template(title: string, date: Date): string {
  return `---
title: ${JSON.stringify(title)}
description: "One sentence that says what the reader will learn."
date: ${localDay(date)}
status: draft
authors:
  - name: "Your Name"
---

Start with the idea in a sentence or two. This article is a draft: it shows while you run the dev
server and stays out of the build until you set \`status: published\`.

## A first section

Write in Markdown. Put images and figure components in a \`figures/\` folder next to this file and
references in \`references.bib\`. The tour article shows every feature, ready to copy.
`;
}

/** `elucidate new "Title"`: creates src/articles/<slug>/index.mdx (docs/spec.md §15). */
export async function newArticle(args: string[], context: Context): Promise<number> {
  const title = args
    .filter((arg) => arg !== '--')
    .join(' ')
    .trim();
  if (!title) {
    throw new Error(`Give the article a title.\n  Example: ${script('new')} -- "Article title"`);
  }
  const slug = slugify(title);
  if (!slug) {
    throw new Error(
      `"${title}" has no letters or digits to make a URL from.\n  Fix: use another title.`,
    );
  }
  const config = await loadSettings(context);
  const folder = `src/articles/${slug}`;
  if (existsSync(join(context.root, folder))) {
    throw new Error(
      `${folder}/ already exists.\n  Fix: choose another title, or edit that article.`,
    );
  }
  mkdirSync(join(context.root, folder), { recursive: true });
  writeFileSync(join(context.root, folder, 'index.mdx'), template(title, new Date()));
  const { base } = siteAndBase(config.url);
  const path = `${base === '/' ? '' : base}/${config.routes.articles}/${slug}/`;
  console.log(`Created ${folder}/index.mdx
  Preview: ${script('dev')}, then open http://localhost:4321${path}`);
  return 0;
}
