import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { isSiteUrl, repositoryFor, slugify, titleFromName } from '../src/create.ts';

const bin = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const starter = fileURLToPath(new URL('../../../starter/', import.meta.url));
let cwd: string;

/** Runs the CLI as `npm create elucidate` would, without a terminal to ask questions in. */
function create(args: string[]): { out: string; status: number } {
  try {
    const out = execFileSync(process.execPath, [bin, ...args, '--template', starter], {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { out, status: 0 };
  } catch (error) {
    const { stderr, status } = error as { stderr: string; status: number };
    return { out: stderr, status };
  }
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'create-elucidate-'));
});

describe('npm create elucidate', () => {
  it('copies the starter and makes it the new site', () => {
    const { out, status } = create([
      'lab-notes',
      '--title',
      "Ada's Notes",
      '--url',
      'https://ada.github.io/lab-notes',
    ]);
    expect(status).toBe(0);
    const site = join(cwd, 'lab-notes');
    const pkg = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('lab-notes');
    expect(pkg.dependencies['astro-elucidate']).toMatch(/^\^\d+\.\d+\.\d+$/);
    expect(pkg.scripts).toMatchObject({ new: 'elucidate new', check: 'elucidate check' });
    const config = readFileSync(join(site, 'elucidate.config.ts'), 'utf8');
    expect(config).toContain("  title: 'Ada\\'s Notes',");
    expect(config).toContain("  url: 'https://ada.github.io/lab-notes',");
    expect(config).toContain("  description: '',");
    expect(config).toContain("  repository: 'https://github.com/ada/lab-notes',");
    expect(config).not.toContain('elucidatejs');
    // Everything a site needs to be written, checked and deployed.
    for (const file of ['README.md', 'AGENTS.md', '.gitignore', '.github/workflows/deploy.yml']) {
      expect(existsSync(join(site, file)), file).toBe(true);
    }
    for (const folder of ['node_modules', 'dist', '.astro']) {
      expect(existsSync(join(site, folder)), folder).toBe(false);
    }
    expect(out).toContain('cd lab-notes');
    expect(out).toContain('preview at http://localhost:4321/lab-notes/');
  });

  it('uses the defaults without a terminal, and names the folder after the title', () => {
    expect(create(['--title', 'Graph Notes']).status).toBe(0);
    const config = readFileSync(join(cwd, 'graph-notes', 'elucidate.config.ts'), 'utf8');
    expect(config).toContain("  url: 'https://example.github.io/graph-notes',");
    expect(config).not.toContain('repository:');
  });

  it('refuses a folder that is not empty, and a URL without protocol', () => {
    mkdirSync(join(cwd, 'taken'));
    writeFileSync(join(cwd, 'taken', 'notes.txt'), '');
    expect(create(['taken'])).toMatchObject({
      status: 1,
      out: expect.stringContaining('taken/ already exists'),
    });
    expect(create(['site', '--url', 'ada.github.io'])).toMatchObject({
      status: 1,
      out: expect.stringContaining('"ada.github.io" is not a full URL.'),
    });
  });
});

describe('helpers', () => {
  it('derives names, titles and repositories', () => {
    expect(slugify('Ada’s Lab Notes!')).toBe('ada-s-lab-notes');
    expect(titleFromName('lab-notes')).toBe('Lab Notes');
    expect(repositoryFor('https://ada.github.io/notes/')).toBe('https://github.com/ada/notes');
    expect(repositoryFor('https://ada.github.io')).toBe('https://github.com/ada/ada.github.io');
    expect(repositoryFor('https://notes.example.org')).toBeUndefined();
    expect(isSiteUrl('https://ada.github.io/notes')).toBe(true);
    expect(isSiteUrl('ftp://ada.github.io')).toBe(false);
  });
});
