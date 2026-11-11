import { expect, it } from 'vitest';
import { exportNames } from '../src/registry.ts';

it('reads the component names a registry exports', () => {
  const source = `
    // Charts
    export { default as Callout } from './Callout.astro';
    export { default as Heatmap, Legend as HeatmapLegend } from './Heatmap.svelte';
    /* export { default as Old } from './Old.astro'; */
    export type { CalloutProps } from './types.ts';
    export { type Theme, Swatch } from './Swatch.astro';
    export const Spacer = () => null;
    export function Sparkline() {}
    export * as Charts from './charts/index.ts';
  `;
  expect(exportNames(source)).toEqual([
    'Callout',
    'Heatmap',
    'HeatmapLegend',
    'Swatch',
    'Spacer',
    'Sparkline',
    'Charts',
  ]);
});

it('explains names it cannot use', () => {
  expect(() => exportNames("export * from './all.ts';")).toThrow('export * from');
  expect(() => exportNames("export { default as callout } from './Callout.astro';")).toThrow(
    'capitalize it, e.g. Callout',
  );
});
