import { createRequire } from 'node:module';
import katex from 'katex';

// MathJax is optional and loaded with require: plugins run after Vite's config loader has closed,
// so a dynamic import() from here would fail when the engine is linked into a workspace.
const require = createRequire(import.meta.url);

export type Engine = 'katex' | 'mathjax';
export type Render = (tex: string, display: boolean) => string | Promise<string>;

/** Renders TeX to HTML with the configured engine; MathJax is loaded only when selected. */
export async function createRenderer(
  engine: Engine,
  macros: Record<string, string>,
): Promise<Render> {
  if (engine === 'mathjax') return (await mathjax(macros)).render;
  return (tex, display) =>
    katex.renderToString(tex, {
      displayMode: display,
      // KaTeX writes \gdef definitions into this object, so each equation gets a copy.
      macros: { ...macros },
      throwOnError: true,
      output: 'htmlAndMathml',
    });
}

/**
 * Source of `virtual:elucidate/math-styles`: the stylesheet pages with math load. KaTeX needs its
 * CSS and fonts (emitted by Vite through `?url`); MathJax's SVG output needs a small inline sheet.
 */
export async function mathStylesModule(engine: Engine, macros: Record<string, string>) {
  if (engine === 'mathjax') {
    return `export default ${JSON.stringify({ css: (await mathjax(macros)).css })};`;
  }
  const css = require.resolve('katex/dist/katex.min.css');
  return `import href from ${JSON.stringify(`${css}?url`)};\nexport default { href };`;
}

let instance: Promise<{ render: Render; css: string }> | undefined;

function mathjax(macros: Record<string, string>) {
  instance ??= loadMathJax(macros);
  return instance;
}

async function loadMathJax(macros: Record<string, string>) {
  const load = <T>(path: string): T => require(`@mathjax/src/js/${path}`) as T;
  let core: typeof import('@mathjax/src/js/mathjax.js');
  try {
    core = load('mathjax.js');
  } catch {
    throw new Error(
      "math.engine: 'mathjax' needs the @mathjax/src package.\n" +
        "  Fix: run npm install @mathjax/src, or set math.engine: 'katex' in elucidate.config.ts.",
    );
  }
  // Lets MathJax load font ranges on demand in Node.
  load('util/asyncLoad/node.js');
  const { TeX } = load<typeof import('@mathjax/src/js/input/tex.js')>('input/tex.js');
  const { SVG } = load<typeof import('@mathjax/src/js/output/svg.js')>('output/svg.js');
  const { liteAdaptor } =
    load<typeof import('@mathjax/src/js/adaptors/liteAdaptor.js')>('adaptors/liteAdaptor.js');
  const { RegisterHTMLHandler } =
    load<typeof import('@mathjax/src/js/handlers/html.js')>('handlers/html.js');
  const { AssistiveMmlHandler } =
    load<typeof import('@mathjax/src/js/a11y/assistive-mml.js')>('a11y/assistive-mml.js');
  for (const name of [
    'base/Base',
    'ams/Ams',
    'newcommand/Newcommand',
    'configmacros/ConfigMacros',
  ]) {
    load(`input/tex/${name}Configuration.js`);
  }

  const adaptor = liteAdaptor();
  AssistiveMmlHandler(RegisterHTMLHandler(adaptor) as Parameters<typeof AssistiveMmlHandler>[0]);
  const tex = new TeX({
    packages: ['base', 'ams', 'newcommand', 'configmacros'],
    macros: mathjaxMacros(macros),
    formatError: (_jax: unknown, error: Error) => {
      throw error;
    },
  });
  const svg = new SVG({ fontCache: 'none' });
  const document = core.mathjax.document('', { InputJax: tex, OutputJax: svg });
  const render: Render = async (source, display) =>
    adaptor.outerHTML(
      await core.mathjax.handleRetriesFor(() => document.convert(source, { display })),
    );
  return { render, css: adaptor.cssText(svg.styleSheet(document) as never) };
}

/** `{ '\\norm': '\\left\\|#1\\right\\|' }` → `{ norm: ['\\left\\|#1\\right\\|', 1] }`. */
export function mathjaxMacros(
  macros: Record<string, string>,
): Record<string, string | [string, number]> {
  return Object.fromEntries(
    Object.entries(macros).map(([name, body]) => {
      const args = Math.max(0, ...[...body.matchAll(/#(\d)/g)].map((m) => Number(m[1])));
      return [name.replace(/^\\/, ''), args > 0 ? [body, args] : body];
    }),
  );
}
