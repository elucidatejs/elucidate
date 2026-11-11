import { z } from 'astro/zod';
import { formatIssues, httpUrl, requiredString, strictObject } from './schema/helpers.ts';

/** Structural components that `overrides` may replace (docs/spec.md §9.2, §11.5). */
export const overridableComponents = [
  'Head',
  'Header',
  'Footer',
  'ArticleHero',
  'Byline',
  'TableOfContents',
  'Appendix',
  'ArticleCard',
] as const;

const navItem = strictObject({
  label: requiredString('Example: label: "About"'),
  href: z.string(),
});

export const configSchema = strictObject({
  title: requiredString('Example: title: "Lab Notes"'),
  url: httpUrl('https://example.github.io/lab-notes'),
  description: z.string().default(''),
  logo: z.string().optional(),
  publisher: z.string().optional(),
  issn: z.string().optional(),
  nav: z.array(navItem).default([{ label: 'Research', href: '/' }]),
  home: z.enum(['index', 'page']).default('index'),
  routes: strictObject({
    articles: z
      .string()
      .regex(/^[a-z0-9-]+$/, {
        error: 'Use lowercase letters, digits and dashes, e.g. "research".',
      })
      .default('research'),
  }).prefault({}),
  license: z.string().default('CC-BY-4.0'),
  repository: httpUrl('https://github.com/me/lab-notes').optional(),
  math: strictObject({
    engine: z.enum(['katex', 'mathjax']).default('katex'),
    macros: z.record(z.string(), z.string()).default({}),
  }).prefault({}),
  numbering: strictObject({ sections: z.boolean().default(false) }).prefault({}),
  index: strictObject({ thumbnails: z.boolean().default(false) }).prefault({}),
  showcase: z.enum(['dev', 'public', 'off']).default('dev'),
  overrides: strictObject(
    Object.fromEntries(overridableComponents.map((name) => [name, z.string().optional()])),
  ).default({}),
});

/** What you write in `elucidate.config.ts`. */
export type ElucidateUserConfig = z.input<typeof configSchema>;
/** The validated config with defaults applied. */
export type ElucidateConfig = z.output<typeof configSchema>;

/** Types the site settings in `elucidate.config.ts`. */
export function defineConfig(config: ElucidateUserConfig): ElucidateUserConfig {
  return config;
}

/** Validates the user config and applies defaults; throws one fix-it message per problem. */
export function parseConfig(input: unknown): ElucidateConfig {
  const result = configSchema.safeParse(input);
  if (result.success) return result.data;
  throw new Error(
    `Invalid site settings.\n${formatIssues('elucidate.config.ts', result.error.issues)}`,
  );
}

/** Splits the public URL into Astro's `site` and `base` (the path, if any). */
export function siteAndBase(url: string): { site: string; base: string } {
  const { origin, pathname } = new URL(url);
  const base = pathname.replace(/\/+$/, '') || '/';
  return { site: `${origin}${base === '/' ? '' : base}`, base };
}
