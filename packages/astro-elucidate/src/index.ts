import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import type { AstroIntegration } from 'astro';
import { fontProviders } from 'astro/config';
import {
  type ElucidateConfig,
  type ElucidateUserConfig,
  parseConfig,
  siteAndBase,
} from './config.ts';
import { builtInComponents } from './markdown/auto-import.ts';
import { shikiConfig } from './markdown/code-theme.ts';
import { markdownPlugins } from './markdown/index.ts';
import { mathStylesModule } from './markdown/math-engines.ts';
import { overridesPlugin, resolveOverrides } from './overrides.ts';
import { bespokeBlocks, type Registry, readRegistry } from './registry.ts';
import { showcaseModule } from './showcase.ts';
import { sitemapIntegration } from './sitemap.ts';

export type { ElucidateConfig, ElucidateUserConfig } from './config.ts';

/**
 * The Elucidate Astro integration: validates the site settings, sets up Markdown/MDX, fonts,
 * overrides, the site's component registry and routes (docs/spec.md §6.1).
 */
export default function elucidate(userConfig: ElucidateUserConfig): AstroIntegration {
  return {
    name: 'astro-elucidate',
    hooks: {
      'astro:config:setup': ({
        config: astro,
        command,
        updateConfig,
        injectRoute,
        addWatchFile,
      }) => {
        const config = parseConfig(userConfig);
        const has = (name: string) => astro.integrations.some((i) => i.name === name);
        const pages = new URL('pages/', astro.srcDir);
        const indexPage = findPage(pages, 'index');
        checkHome(config, indexPage);
        const overrides = resolveOverrides(config.overrides, astro.root);
        const registry = readRegistry(astro.srcDir, [...builtInComponents, ...bespokeBlocks]);
        // The registry decides what MDX imports automatically, so a change restarts the server.
        addWatchFile(registry.file ?? new URL('components/index.ts', astro.srcDir));

        updateConfig({
          ...siteAndBase(config.url),
          markdown: {
            processor: unified(markdownPlugins(config, fileURLToPath(pages), registry.names)),
            shikiConfig,
          },
          integrations: [
            ...(has('@astrojs/mdx') ? [] : [mdx()]),
            ...(has('@astrojs/sitemap') ? [] : [sitemapIntegration(config, astro.srcDir)]),
          ],
          fonts: [
            font('Inter', '--el-font-inter', ['400 600'], ['system-ui', 'sans-serif']),
            font('JetBrains Mono', '--el-font-jetbrains-mono', ['400', '500'], ['monospace']),
          ],
          vite: {
            plugins: [virtualModules(config, astro.srcDir, registry), overridesPlugin(overrides)],
          },
        });

        const articles = `/${config.routes.articles}`;
        const route = (pattern: string, file: string) =>
          injectRoute({ pattern, entrypoint: new URL(`./routes/${file}`, import.meta.url) });
        route(config.home === 'index' ? '/' : articles, 'index.astro');
        route(`${articles}/[slug]`, 'article.astro');
        route(`${articles}/tag/[tag]`, 'tag.astro');
        if (!findPage(pages, '404')) route('/404', '404.astro');
        // Feeds and machine-readable files (§10.3), unless the site has its own.
        for (const file of ['rss.xml', 'llms.txt', 'robots.txt']) {
          if (!findPage(pages, file) && !existsSync(new URL(file, astro.publicDir))) {
            route(`/${file}`, `${file}.ts`);
          }
        }
        const showcase =
          config.showcase === 'public' || (config.showcase === 'dev' && command === 'dev');
        if (showcase && !findPage(pages, 'components')) route('/components', 'components.astro');
      },
    },
  };
}

function font(name: string, cssVariable: string, weights: string[], fallbacks: string[]) {
  const provider = fontProviders.fontsource();
  return {
    provider,
    name,
    cssVariable,
    weights,
    styles: ['normal' as const],
    subsets: ['latin'],
    fallbacks,
  };
}

function findPage(pages: URL, name: string): string | undefined {
  const ext = ['astro', 'mdx', 'md', 'html', 'ts', 'js'].find((e) =>
    existsSync(new URL(`${name}.${e}`, pages)),
  );
  return ext && `src/pages/${name}.${ext}`;
}

function checkHome(config: ElucidateConfig, indexPage: string | undefined): void {
  if (config.home === 'index' && indexPage) {
    throw new Error(
      `${indexPage} conflicts with home: 'index', which puts the article index at /.\n` +
        `  Fix: set home: 'page' in elucidate.config.ts to use ${indexPage} as the homepage ` +
        `(the index moves to /${config.routes.articles}/), or remove ${indexPage}.`,
    );
  }
  if (config.home === 'page' && !indexPage) {
    throw new Error(
      `home: 'page' needs a homepage, but src/pages/index.(mdx|astro) does not exist.\n` +
        `  Fix: add src/pages/index.mdx, or set home: 'index' in elucidate.config.ts.`,
    );
  }
}

/**
 * Exposes the validated config, the optional user stylesheet, math styles, the site's components
 * and the component overview's examples as virtual modules.
 */
function virtualModules(config: ElucidateConfig, srcDir: URL, registry: Registry) {
  const themeCss = new URL('styles/theme.css', srcDir);
  const modules: Record<string, () => string | Promise<string>> = {
    'virtual:elucidate/config': () => `export default ${JSON.stringify(config)};`,
    'virtual:elucidate/user-styles': () =>
      existsSync(themeCss) ? `import ${JSON.stringify(fileURLToPath(themeCss))};` : '',
    'virtual:elucidate/math-styles': () => mathStylesModule(config.math.engine, config.math.macros),
    'virtual:elucidate/user-components': () =>
      registry.file ? `export * from ${JSON.stringify(registry.file.replaceAll('\\', '/'))};` : '',
    'virtual:elucidate/showcase': () => showcaseModule(registry.names, srcDir),
  };
  return {
    name: 'astro-elucidate:virtual-modules',
    resolveId: (id: string) => (id in modules ? `\0${id}` : undefined),
    load: (id: string) => (id.startsWith('\0') ? modules[id.slice(1)]?.() : undefined),
  };
}
