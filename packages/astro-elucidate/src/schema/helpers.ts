import { z } from 'astro/zod';
import { closest } from '../lib/suggest.ts';

/** A strict object whose unknown-key errors suggest the closest valid key. */
export function strictObject<T extends z.ZodRawShape>(shape: T) {
  const allowed = Object.keys(shape);
  return z.strictObject(shape, {
    error: (issue) => {
      if (issue.code !== 'unrecognized_keys') return undefined;
      return issue.keys
        .map((key) => {
          const hint = closest(key, allowed);
          return hint
            ? `Unknown key "${key}". Did you mean "${hint}"?`
            : `Unknown key "${key}". Allowed keys: ${allowed.join(', ')}.`;
        })
        .join(' ');
    },
  });
}

/** A required string with a fix-it message when it is missing or empty. */
export function requiredString(example: string) {
  return z
    .string({ error: (issue) => (issue.input === undefined ? `Required. ${example}` : undefined) })
    .min(1, { error: `Must not be empty. ${example}` });
}

/** An http(s) URL with a message that shows the expected form. */
export function httpUrl(example = 'https://example.org') {
  return z.url({
    protocol: /^https?$/,
    error: (issue) =>
      issue.input === undefined
        ? `Required. Expected a full URL, e.g. "${example}".`
        : `${JSON.stringify(issue.input)} is not a full URL. Expected one with protocol, e.g. "${example}".`,
  });
}

/** Formats a Zod issue path like `authors[0].orcid`. */
export function formatPath(path: PropertyKey[]): string {
  return path
    .map((key, i) => (typeof key === 'number' ? `[${key}]` : `${i > 0 ? '.' : ''}${String(key)}`))
    .join('');
}

/** Formats issues as `<file> → <path>` followed by an indented message, one block per issue. */
export function formatIssues(file: string, issues: z.core.$ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = formatPath(issue.path);
      return `${file}${path ? ` → ${path}` : ''}\n  ${issue.message}`;
    })
    .join('\n');
}
