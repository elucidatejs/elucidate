// Saves screenshots of the starter for visual review (docs/spec.md §16). Not a test.
// Usage: `pnpm shots` (default pages) or `pnpm shots -- /some/path/` (one page).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const port = 4323;
const origin = `http://localhost:${port}`;
const outDir = '.screenshots';
// Extend as milestones add pages (articles, About, /components/, an open overlay).
const defaultPages = ['/'];
const widths = [375, 1440];
const themes = ['light', 'dark'] as const;

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const pages = args.length > 0 ? args : defaultPages;

execSync('pnpm --filter elucidate-starter build', { stdio: 'inherit' });
// `--ignore-lock` keeps `astro preview` in the foreground (Astro backgrounds it when run by an agent).
const preview = ['--filter', 'elucidate-starter', 'preview', '--port', `${port}`, '--ignore-lock'];
const server = spawn('pnpm', preview, { detached: true, stdio: 'ignore' });

try {
  await waitFor(origin);
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const path of pages) {
    for (const width of widths) {
      for (const theme of themes) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme: theme,
        });
        const page = await context.newPage();
        await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' });
        const name = path.replace(/^\/+|\/+$/g, '').replaceAll('/', '_') || 'home';
        await page.screenshot({ path: `${outDir}/${name}-${width}-${theme}.png`, fullPage: true });
        await context.close();
      }
    }
  }
  await browser.close();
  console.log(`Saved ${pages.length * widths.length * themes.length} screenshots to ${outDir}/`);
} finally {
  if (server.pid) process.kill(-server.pid);
}

async function waitFor(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not start at ${url} within ${timeoutMs / 1000}s.`);
}
