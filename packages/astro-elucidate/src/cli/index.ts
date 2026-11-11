import { check } from './check.ts';
import { newArticle } from './new.ts';
import type { Context } from './site.ts';

const usage = `Usage:
  elucidate new "Article title"   Start src/articles/<slug>/index.mdx from a template.
  elucidate check                 Check the settings, front matter, references and types.`;

/** Runs `elucidate <command>` (docs/spec.md §15) and returns the exit code. */
export async function run(args: string[], context: Context): Promise<number> {
  const [command, ...rest] = args;
  try {
    if (command === 'new') return await newArticle(rest, context);
    if (command === 'check') return await check(context);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const help = command === undefined || command === '--help' || command === '-h';
  if (!help) console.error(`Unknown command "${command}".\n`);
  console.log(usage);
  return help ? 0 : 1;
}
