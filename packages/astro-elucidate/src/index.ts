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
import { shikiConfig } from './markdown/code-theme.ts';
import { markdownPlugins } from './markdown/index.ts';
import { mathStylesModule } from './markdown/math-engines.ts';

export type { ElucidateConfig, ElucidateUserConfig } from './config.ts';

/**
 * The Elucidate Astro integration: validates the site settings, sets up Markdown/MDX, fonts and
 * routes (docs/spec.md §6.1).
 */
export default function elucidate(userConfig: ElucidateUserConfig): AstroIntegration {
  return {
    name: 'astro-elucidate',
    hooks: {
      'astro:config:setup': ({ config: astro, updateConfig, injectRoute }) => {
        const config = parseConfig(userConfig);
        const pages = new URL('pages/', astro.srcDir);
        const indexPage = findPage(pages, 'index');
        checkHome(config, indexPage);

        updateConfig({
          ...siteAndBase(config.url),
          markdown: {
            processor: unified(markdownPlugins(config, fileURLToPath(pages))),
            shikiConfig,
          },
          integrations: astro.integrations.some((i) => i.name === '@astrojs/mdx') ? [] : [mdx()],
          fonts: [
            font('Inter', '--el-font-inter', ['400 600'], ['system-ui', 'sans-serif']),
            font('JetBrains Mono', '--el-font-jetbrains-mono', ['400', '500'], ['monospace']),
          ],
          vite: { plugins: [virtualModules(config, new URL('styles/theme.css', astro.srcDir))] },
        });

        const articles = `/${config.routes.articles}`;
        const route = (pattern: string, file: string) =>
          injectRoute({ pattern, entrypoint: new URL(`./routes/${file}`, import.meta.url) });
        route(config.home === 'index' ? '/' : articles, 'index.astro');
        route(`${articles}/[slug]`, 'article.astro');
        route(`${articles}/tag/[tag]`, 'tag.astro');
        if (!findPage(pages, '404')) route('/404', '404.astro');
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

/** Exposes the validated config, the optional user stylesheet and math styles as virtual modules. */
function virtualModules(config: ElucidateConfig, themeCss: URL) {
  const modules: Record<string, () => string | Promise<string>> = {
    'virtual:elucidate/config': () => `export default ${JSON.stringify(config)};`,
    'virtual:elucidate/user-styles': () =>
      existsSync(themeCss) ? `import ${JSON.stringify(fileURLToPath(themeCss))};` : '',
    'virtual:elucidate/math-styles': () => mathStylesModule(config.math.engine, config.math.macros),
  };
  return {
    name: 'astro-elucidate:virtual-modules',
    resolveId: (id: string) => (id in modules ? `\0${id}` : undefined),
    load: (id: string) => (id.startsWith('\0') ? modules[id.slice(1)]?.() : undefined),
  };
}
