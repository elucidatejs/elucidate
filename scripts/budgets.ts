// Performance budgets (docs/spec.md §13.3), measured on the starter's production build:
// - the example article: core client JS ≤ 6 KB and CSS without math ≤ 25 KB (gzip), ≤ 2 fonts
//   preloaded;
// - pages without math, figures or overlays (the index, About): no math CSS, no figure or overlay
//   JS.
// "Core" JS is every script the engine adds: the inline ones and the bundled scripts of engine
// components. The site's own scripts (the tour's figure) are reported but not counted.
// Usage: `pnpm budgets` after `pnpm build`.
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { base } from '../e2e/site.ts';

const dist = 'starter/dist';
const KB = 1024;
const budget = { js: 6 * KB, css: 25 * KB, fonts: 2 };

// Engine components by file name: their bundled scripts are named `<Name>.astro_astro_type_script…`.
const engine = new Set<string>();
const collect = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) collect(join(dir, entry.name));
    else if (entry.name.endsWith('.astro')) engine.add(entry.name);
  }
};
collect('packages/astro-elucidate/src');

const gzip = (text: string) => gzipSync(text, { level: 9 }).length;
const asset = (href: string) => readFileSync(join(dist, href.slice(base.length)), 'utf8');
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

/** A script with the chunks it imports, each counted once. */
function scriptSize(code: string, seen: Set<string>): number {
  let size = gzip(code);
  for (const [, path] of code.matchAll(
    /from\s*["']([^"']+\.js)["']|import\s*["']([^"']+\.js)["']/g,
  )) {
    const file = basename(path ?? '');
    if (!file || seen.has(file)) continue;
    seen.add(file);
    size += scriptSize(asset(`${base}_astro/${file}`), seen);
  }
  return size;
}

interface Page {
  coreJs: number;
  siteJs: number;
  css: number;
  mathCss: boolean;
  fonts: number;
  overlayJs: boolean;
}

function measure(path: string): Page {
  const html = readFileSync(join(dist, path, 'index.html'), 'utf8');
  const page: Page = { coreJs: 0, siteJs: 0, css: 0, mathCss: false, fonts: 0, overlayJs: false };
  const seen = new Set<string>();
  for (const [, attrs = '', body = ''] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue;
    const src = attr(attrs, 'src');
    const code = src ? asset(src) : body;
    if (code.includes('el-overlay')) page.overlayJs = true;
    const name = src ? basename(src).split('_astro_type_script')[0] : '';
    if (src && !engine.has(name ?? '')) page.siteJs += scriptSize(code, seen);
    else page.coreJs += scriptSize(code, seen);
  }
  for (const [tag] of html.matchAll(/<link [^>]*>/g)) {
    if (tag.includes('rel="preload"') && tag.includes('as="font"')) page.fonts++;
    if (!tag.includes('rel="stylesheet"')) continue;
    const href = attr(tag, 'href') ?? '';
    if (/katex|mathjax/i.test(href)) page.mathCss = true;
    else page.css += gzip(asset(href));
  }
  for (const [, css = ''] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    // MathJax's own styles; the engine's CSS only mentions mjx-container in overrides.
    if (css.includes('mjx-container[jax=')) page.mathCss = true;
    else page.css += gzip(css);
  }
  return page;
}

const kb = (bytes: number) => `${(bytes / KB).toFixed(1)} KB`;
const failures: string[] = [];
const check = (ok: boolean, line: string) => {
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${line}`);
  if (!ok) failures.push(line);
};

const tour = measure('research/a-tour-of-elucidate');
console.log('research/a-tour-of-elucidate/');
check(tour.coreJs <= budget.js, `core JS ${kb(tour.coreJs)} of ${kb(budget.js)} (gzip)`);
check(tour.css <= budget.css, `CSS without math ${kb(tour.css)} of ${kb(budget.css)} (gzip)`);
check(tour.fonts <= budget.fonts, `${tour.fonts} of ${budget.fonts} fonts preloaded`);
console.log(`      the site's own scripts: ${kb(tour.siteJs)} (not budgeted)`);

for (const path of ['', 'about']) {
  const page = measure(path);
  console.log(`${path}/`);
  check(!page.mathCss, 'no math CSS');
  check(page.siteJs === 0 && !page.overlayJs, 'no figure or overlay JS');
}

if (failures.length > 0) {
  console.error(`\n${failures.length} budget(s) exceeded (docs/spec.md §13.3).`);
  process.exit(1);
}
