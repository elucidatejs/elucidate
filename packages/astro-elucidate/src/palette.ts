// The data palette for figures (docs/spec.md §8.5, §12.4), read from the page's resolved CSS so
// that theme overrides and dark mode apply. Browser only: call it from a client script.
//
//   import { palette, onThemeChange } from 'astro-elucidate/palette';
//   const c = palette();
//   onThemeChange(() => redraw(palette()));

export interface Palette {
  /** Eight colors for categories, in the order to use them. */
  categorical: string[];
  /** A color for a magnitude, from faint (0) to strong (1). */
  sequential: (t: number) => string;
  /** A color around a midpoint: one hue at 0, neutral gray at 0.5, the other hue at 1. */
  diverging: (t: number) => string;
  /** Text color, for values and titles. */
  text: string;
  /** Muted text, for axis labels and ticks. */
  muted: string;
  /** Axes and gridlines. */
  grid: string;
  /** The page background, for gaps and rings around marks. */
  background: string;
}

type Rgba = [number, number, number, number];

const steps = (prefix: string) => Array.from({ length: 9 }, (_, i) => `--el-${prefix}-${i}`);

/**
 * The palette as colors in `#rrggbb` form (`rgb(r g b / a)` when a token is translucent). Pass an
 * element to resolve tokens overridden on it or its ancestors; the default is the page.
 */
export function palette(scope?: Element): Palette {
  if (typeof document === 'undefined') {
    throw new Error('palette() reads the page’s CSS, so it runs only in the browser.');
  }
  const probe = document.createElement('span');
  probe.style.display = 'none';
  (scope ?? document.body).append(probe);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  // `getComputedStyle` resolves var() and light-dark(); the canvas turns any color syntax the
  // browser knows (oklch(), color-mix(), …) into sRGB bytes.
  const rgba = (token: string): Rgba => {
    probe.style.color = `var(${token})`;
    const color = getComputedStyle(probe).color;
    if (!context) return parseRgb(color);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000';
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 255] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };

  try {
    const sequential = steps('seq').map(rgba);
    const diverging = steps('div').map(rgba);
    return {
      categorical: Array.from({ length: 8 }, (_, i) => format(rgba(`--el-data-${i + 1}`))),
      sequential: (t) => format(interpolate(sequential, t)),
      diverging: (t) => format(interpolate(diverging, t)),
      text: format(rgba('--el-text')),
      muted: format(rgba('--el-data-label')),
      grid: format(rgba('--el-data-grid')),
      background: format(rgba('--el-bg')),
    };
  } finally {
    probe.remove();
  }
}

/**
 * Calls `callback` after the page switches between light and dark, by the theme toggle or the
 * system setting. Returns a function that stops listening.
 */
export function onThemeChange(callback: () => void): () => void {
  let frame = 0;
  // A system change can arrive twice (media query, then the toggle script); call back once.
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => callback());
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme', 'class', 'style'] });
  const system = matchMedia('(prefers-color-scheme: dark)');
  system.addEventListener('change', schedule);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    system.removeEventListener('change', schedule);
  };
}

function interpolate(ramp: Rgba[], t: number): Rgba {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * (ramp.length - 1);
  const i = Math.min(Math.floor(x), ramp.length - 2);
  const f = x - i;
  const a = ramp[i] as Rgba;
  const b = ramp[i + 1] as Rgba;
  return [0, 1, 2, 3].map(
    (k) => (a[k] as number) + ((b[k] as number) - (a[k] as number)) * f,
  ) as Rgba;
}

function format([r, g, b, a]: Rgba): string {
  const [R, G, B] = [r, g, b].map((v) => Math.round(v));
  if (a < 1) return `rgb(${R} ${G} ${B} / ${Math.round(a * 1000) / 1000})`;
  return `#${[R, G, B].map((v) => (v as number).toString(16).padStart(2, '0')).join('')}`;
}

/** Fallback without a canvas: `rgb(r, g, b)` and `rgba(r, g, b, a)` as browsers serialize them. */
function parseRgb(color: string): Rgba {
  const [r = 0, g = 0, b = 0, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b, a];
}
