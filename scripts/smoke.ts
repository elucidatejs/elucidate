// The M4 path end to end, as a new user takes it (docs/spec.md §18): `npm create elucidate`,
// `npm install`, `npm run new`, `npm run check`, `npm run build` for a site under a project path,
// then every page and link of the build served under that path. Uses the packed packages, so it
// tests what npm would publish; needs the npm registry for the other dependencies.
// Usage: `pnpm smoke` (after `pnpm build`). The site stays in .smoke/ for a look.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const work = resolve('.smoke');
const site = join(work, 'lab-notes');
const base = '/lab-notes/';
const sh = (cmd: string, args: string[], cwd = work) => {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
};

rmSync(work, { recursive: true, force: true });
mkdirSync(work);
sh('pnpm', ['--filter', 'create-elucidate', 'build'], '.');
for (const pkg of ['astro-elucidate', 'create-elucidate']) {
  sh('pnpm', ['pack', '--pack-destination', work], `packages/${pkg}`);
}
const tarball = (name: string) => {
  const { version } = JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8'));
  return join(work, `${name}-${version}.tgz`);
};

// npm create elucidate@latest lab-notes, with the packed package and the local starter (the
// release tag it would download does not exist before the release).
sh('npm', [
  'exec',
  '--yes',
  `--package=${tarball('create-elucidate')}`,
  '--',
  'create-elucidate',
  'lab-notes',
  '--title',
  'Lab Notes',
  '--url',
  `https://ada.github.io${base.slice(0, -1)}`,
  '--template',
  resolve('starter'),
]);
// Until 0.1.0 is on npm, install the packed engine instead.
const pkgFile = join(site, 'package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
pkg.dependencies['astro-elucidate'] = `file:${tarball('astro-elucidate')}`;
writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
sh('npm', ['install', '--no-audit', '--no-fund'], site);

console.log(sh('npm', ['run', 'new', '--', 'Hello, Pages'], site));
const article = join(site, 'src/articles/hello-pages/index.mdx');
writeFileSync(article, readFileSync(article, 'utf8').replace('status: draft', 'status: published'));
sh('npm', ['run', 'check'], site);
sh('npm', ['run', 'build'], site);

// Serve dist/ under the base path only, as GitHub Pages serves a project site, and follow every
// internal link from the homepage.
const dist = join(site, 'dist');
const types: Record<string, string> = { '.html': 'text/html', '.xml': 'application/xml' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  let file = path.startsWith(base) ? join(dist, path.slice(base.length)) : '';
  if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file || !existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise<void>((done) => server.listen(4330, done));
const origin = 'http://localhost:4330';
const seen = new Set<string>();
const broken: string[] = [];
const queue = [
  base,
  `${base}rss.xml`,
  `${base}llms.txt`,
  `${base}robots.txt`,
  `${base}sitemap-index.xml`,
];
while (queue.length > 0) {
  const path = queue.shift() as string;
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await fetch(origin + path);
  if (!res.ok) {
    broken.push(`${res.status} ${path}`);
    continue;
  }
  if (!res.headers.get('content-type')?.startsWith('text/html')) continue;
  const html = await res.text();
  for (const [, link] of html.matchAll(/(?:href|src)="([^"#]+)/g)) {
    const url = new URL(link as string, origin + path);
    if (url.origin === origin) queue.push(url.pathname);
  }
}
server.close();

const expected = [`${base}research/hello-pages/`, `${base}research/a-tour-of-elucidate/`];
const missing = expected.filter((path) => !seen.has(path));
if (broken.length > 0 || missing.length > 0) {
  console.error(
    `Broken: ${broken.join(', ') || 'none'}\nNot linked: ${missing.join(', ') || 'none'}`,
  );
  process.exit(1);
}
console.log(`\nOK: ${seen.size} pages and files under ${base}, no broken links.`);
