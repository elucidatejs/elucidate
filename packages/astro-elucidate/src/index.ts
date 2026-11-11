import type { AstroIntegration } from 'astro';

/**
 * The Elucidate Astro integration.
 *
 * M0 skeleton: it registers itself and does nothing else yet. Configuration,
 * routes, markdown plugins and styles arrive in M1–M3 (docs/spec.md §6.1, §18).
 */
export default function elucidate(): AstroIntegration {
  return {
    name: 'astro-elucidate',
    hooks: {},
  };
}
