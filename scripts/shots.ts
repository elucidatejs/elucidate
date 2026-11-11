// Saves screenshots of the starter for visual review (docs/spec.md §16). Not a test.
// Usage: `pnpm shots` (default pages) or `pnpm shots -- research/hello-world/` (one page).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { base } from '../e2e/site.ts';

const port = 4323;
const devPort = 4325;
const origin = `http://localhost:${port}${base}`;
const devOrigin = `http://localhost:${devPort}${base}`;
const outDir = '.screenshots';
// Paths relative to the site's base. The overlay is opened by its hash; the component overview
// exists only on the dev server (showcase: 'dev').
const defaultPages = [
  '',
  'research/a-tour-of-elucidate/',
  'research/a-tour-of-elucidate/#explorer',
  'research/hello-world/',
  'about/',
  'components/',
];
const onDevServer = (path: string) => path.replace(/^\/+/, '').startsWith('components/');
const widths = [375, 1440];
const themes = ['light', 'dark'] as const;

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const pages = args.length > 0 ? args : defaultPages;

execSync('pnpm --filter elucidate-starter build', { stdio: 'inherit' });
// `--ignore-lock` keeps `astro preview` in the foreground (Astro backgrounds it when run by an agent).
const preview = ['--filter', 'elucidate-starter', 'preview', '--port', `${port}`, '--ignore-lock'];
const server = spawn('pnpm', preview, { detached: true, stdio: 'ignore' });
const dev = pages.some(onDevServer)
  ? spawn(
      'pnpm',
      ['--filter', 'elucidate-starter', 'dev', '--port', `${devPort}`, '--ignore-lock'],
      {
        detached: true,
        stdio: 'ignore',
      },
    )
  : undefined;

try {
  await waitFor(origin);
  if (dev) await waitFor(devOrigin);
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
        const from = onDevServer(path) ? devOrigin : origin;
        await page.goto(new URL(path.replace(/^\/+/, ''), from).href, {
          waitUntil: 'networkidle',
        });
        // Astro's toolbar on the dev server is not part of the site.
        await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
        // Lazy images below the window would be blank in a full-page shot.
        await page.evaluate(() =>
          Promise.all(
            [...document.images].map((img) => {
              img.loading = 'eager';
              return img.decode().catch(() => {});
            }),
          ),
        );
        const name =
          path
            .replace(/^\/+|\/+$/g, '')
            .replace('/#', '_')
            .replaceAll('/', '_') || 'home';
        // An open overlay covers the window, so it gets a window-sized shot.
        await page.screenshot({
          path: `${outDir}/${name}-${width}-${theme}.png`,
          fullPage: !path.includes('#'),
        });
        await context.close();
      }
    }
  }
  await browser.close();
  console.log(`Saved ${pages.length * widths.length * themes.length} screenshots to ${outDir}/`);
} finally {
  if (server.pid) process.kill(-server.pid);
  if (dev?.pid) process.kill(-dev.pid);
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
