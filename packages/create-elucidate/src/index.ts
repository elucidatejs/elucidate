#!/usr/bin/env node
// `npm create elucidate@latest [folder]` (docs/spec.md §15): copies the starter from the release
// that matches this version, makes it the reader's own and says what to do next.
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { downloadTemplate } from 'giget';
import {
  isSiteUrl,
  personalize,
  placeholderUrl,
  repositoryFor,
  slugify,
  titleFromName,
} from './create.ts';

const usage = `Usage: npm create elucidate@latest [folder] -- [options]

Options:
  --title <title>     The site title (asked if not given)
  --url <url>         The site's public URL, e.g. https://ada.github.io/notes (asked if not given)
  --yes, -y           Use the defaults instead of asking
  --template <source> A local starter folder or a giget source, instead of this release's starter`;

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: 'string' },
      url: { type: 'string' },
      yes: { type: 'boolean', short: 'y' },
      template: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) return void console.log(usage);

  const readline =
    process.stdin.isTTY && !values.yes
      ? createInterface({ input: process.stdin, output: process.stdout })
      : undefined;
  const ask = async (question: string, fallback: string, valid = (_: string) => true) => {
    if (!readline) return fallback;
    for (;;) {
      const answer = (await readline.question(`${question} (${fallback}): `)).trim() || fallback;
      if (valid(answer)) return answer;
      console.log('  Expected a full URL with https://.');
    }
  };

  const folder = positionals[0];
  const title =
    values.title ??
    (await ask('Site title', folder ? titleFromName(basename(folder)) : 'My Journal'));
  const dir = folder ?? (slugify(title) || 'my-journal');
  const target = resolve(dir);
  const url = values.url ?? (await ask('Public URL', placeholderUrl(basename(target)), isSiteUrl));
  readline?.close();
  if (!isSiteUrl(url))
    throw new Error(
      `"${url}" is not a full URL.\n  Fix: pass one with https://, e.g. --url https://ada.github.io/notes`,
    );
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`${dir}/ already exists and is not empty.\n  Fix: choose another folder name.`);
  }

  await copyStarter(
    values.template ?? `gh:elucidatejs/elucidate/starter#create-elucidate@${version}`,
    target,
  );
  personalize(target, { name: basename(target), title, url, engine: `^${version}` });
  console.log(nextSteps(relative(process.cwd(), target) || '.', title, url));
}

/** Copies a local starter folder, or downloads one with giget. */
async function copyStarter(source: string, target: string): Promise<void> {
  if (existsSync(source)) {
    const skip = ['node_modules', 'dist', '.astro'];
    cpSync(source, target, {
      recursive: true,
      filter: (path) =>
        !relative(source, path)
          .split(sep)
          .some((part) => skip.includes(part)),
    });
    return;
  }
  try {
    await downloadTemplate(source, { dir: target, silent: true });
  } catch (error) {
    throw new Error(
      `Could not download the starter (${error instanceof Error ? error.message : error}).\n` +
        '  Fix: check the connection and try again, or pass --template with a local starter folder.',
    );
  }
}

function nextSteps(dir: string, title: string, url: string): string {
  const pm = process.env.npm_config_user_agent?.split('/')[0] ?? 'npm';
  const run = (script: string) => (pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`);
  const base = new URL(url).pathname.replace(/\/*$/, '/');
  const repository = repositoryFor(url);
  return `
Created ${dir}/ for “${title}”.

Next steps:
  cd ${dir}
  ${pm} install
  ${run('dev')}                       preview at http://localhost:4321${base}
  ${run('new')} -- "Article title"    start an article

To publish on GitHub Pages, push to ${repository ?? 'a GitHub repository'} and set
Settings → Pages → Source to “GitHub Actions”. The url in elucidate.config.ts must be the
site's public address.

Guide: https://github.com/elucidatejs/elucidate/blob/main/docs/getting-started.md`;
}
