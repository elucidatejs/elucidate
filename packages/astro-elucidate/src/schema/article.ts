import { z } from 'astro/zod';
import { closest } from '../lib/suggest.ts';
import { httpUrl, requiredString, strictObject } from './helpers.ts';

const ORCID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const DOI = /^10\.\d{4,9}\/\S+$/;

const date = (field: string) =>
  z.coerce.date({
    error: (issue) =>
      issue.input === undefined
        ? `Required. Example: ${field}: 2026-11-10`
        : `${JSON.stringify(issue.input)} is not a date. Expected YYYY-MM-DD, e.g. ${field}: 2026-11-10`,
  });

const author = strictObject({
  name: requiredString('Example: name: "Ada Lovelace"'),
  url: httpUrl('https://example.org/ada').optional(),
  orcid: z
    .string()
    .regex(ORCID, {
      error: (issue) =>
        `${JSON.stringify(issue.input)} is not a valid ORCID. Expected 0000-0000-0000-0000 (last character may be X).`,
    })
    .optional(),
  affiliations: z.array(z.string()).default([]),
  equal: z.boolean().default(false),
});

const affiliation = strictObject({
  name: requiredString('Example: cam: { name: "University of Cambridge" }'),
  url: httpUrl('https://www.cam.ac.uk').optional(),
});

export const articleSchema = strictObject({
  title: requiredString('Example: title: "Understanding Convolutions on Graphs"'),
  description: requiredString('Add one sentence, e.g. description: "The building blocks of GNNs."'),
  date: date('date'),
  updated: date('updated').optional(),
  status: z.enum(['draft', 'review', 'published']).default('draft'),
  doi: z
    .string()
    .regex(DOI, {
      error: (issue) =>
        `${JSON.stringify(issue.input)} is not a DOI. Expected the bare DOI, e.g. 10.5281/zenodo.1234567`,
    })
    .optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  license: z.string().optional(),
  abstract: z.string().optional(),
  authors: z
    .array(author, { error: 'Required. Example: authors: [{ name: "Ada Lovelace" }]' })
    .min(1, { error: 'Add at least one author, e.g. authors: [{ name: "Ada Lovelace" }]' }),
  affiliations: z.record(z.string(), affiliation).default({}),
  reviews: z.array(strictObject({ label: z.string(), url: httpUrl() })).default([]),
  hero: strictObject({
    width: z.enum(['wide', 'page', 'screen']).default('page'),
    position: z.enum(['below', 'above']).default('below'),
    alt: z.string().optional(),
  }).prefault({}),
  toc: z.boolean().default(true),
  layout: z.enum(['article', 'bespoke']).default('article'),
  bibliography: z.string().optional(),
}).superRefine((data, ctx) => {
  const keys = Object.keys(data.affiliations);
  data.authors.forEach((a, i) => {
    a.affiliations.forEach((key, j) => {
      if (keys.includes(key)) return;
      const hint = closest(key, keys);
      ctx.addIssue({
        code: 'custom',
        path: ['authors', i, 'affiliations', j],
        message: hint
          ? `Unknown affiliation "${key}". Did you mean "${hint}"?`
          : `Unknown affiliation "${key}". Define it under affiliations, e.g. ${key}: { name: "University of Cambridge" }`,
      });
    });
  });
});

export type ArticleData = z.output<typeof articleSchema>;
export type Author = ArticleData['authors'][number];
