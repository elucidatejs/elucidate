// Lighthouse (mobile) ≥ 95 for Performance, Accessibility, Best Practices and SEO on the example
// article (docs/spec.md §13.3), served by `astro preview` from the starter's build. Lighthouse runs
// through `pnpm dlx` at a pinned version, so the workspace does not depend on it, and drives
// Playwright's Chromium. The full report is saved in .lighthouse/.
// Usage: `pnpm lighthouse` (after `pnpm build`).
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { base } from '../e2e/site.ts';

const version = '13.6.0';
const port = 4327;
const url = `http://localhost:${port}${base}research/a-tour-of-elucidate/`;
const report = '.lighthouse/a-tour-of-elucidate.json';
const minimum = 95;
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

interface Report {
  categories: Record<
    string,
    { title: string; score: number; auditRefs: { id: string; weight: number }[] }
  >;
  audits: Record<string, { title: string; score: number | null; displayValue?: string }>;
}

mkdirSync('.lighthouse', { recursive: true });
const preview = ['--filter', 'elucidate-starter', 'preview', '--port', `${port}`, '--ignore-lock'];
const server = spawn('pnpm', preview, { detached: true, stdio: 'ignore' });
try {
  await waitFor(url);
  execFileSync(
    'pnpm',
    [
      'dlx',
      `lighthouse@${version}`,
      url,
      '--quiet',
      '--output=json',
      `--output-path=${report}`,
      `--only-categories=${categories.join(',')}`,
      '--chrome-flags=--headless=new --no-sandbox',
    ],
    { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
  );
} finally {
  if (server.pid) process.kill(-server.pid);
}

const { categories: results, audits } = JSON.parse(readFileSync(report, 'utf8')) as Report;
let failed = false;
for (const id of categories) {
  const category = results[id];
  if (!category) throw new Error(`No ${id} score in ${report}.`);
  const score = Math.round(category.score * 100);
  const ok = score >= minimum;
  failed ||= !ok;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${category.title} ${score} (minimum ${minimum})`);
  // What cost points, so a failure says where to look.
  for (const { id: audit, weight } of category.auditRefs) {
    const result = audits[audit];
    if (weight > 0 && result && result.score !== null && result.score < 1) {
      console.log(
        `        ${result.title}${result.displayValue ? `: ${result.displayValue}` : ''}`,
      );
    }
  }
}
if (failed) {
  console.error(`\nLighthouse scores below ${minimum} (docs/spec.md §13.3). Report: ${report}`);
  process.exit(1);
}

async function waitFor(target: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(target)).ok) return;
    } catch {}
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`${target} did not respond within ${timeoutMs / 1000} s.`);
}
