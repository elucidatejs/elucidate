import { expect, it } from 'vitest';
import elucidate from '../src/index.ts';

it('returns a named Astro integration', () => {
  const integration = elucidate();
  expect(integration.name).toBe('astro-elucidate');
  expect(integration.hooks).toEqual({});
});
