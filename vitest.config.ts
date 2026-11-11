import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const stub = (file: string) =>
  fileURLToPath(new URL(`./packages/astro-elucidate/test/stubs/${file}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'astro:content': stub('astro-content.ts'),
      'virtual:elucidate/config': stub('elucidate-config.ts'),
    },
  },
  test: { include: ['packages/*/test/**/*.test.ts'] },
});
