import { defineConfig, devices } from '@playwright/test';
import { base } from './e2e/site.ts';

const port = 4322;
const devPort = 4324;

// E2E tests run against the production build of starter/ (run `pnpm build` first). The component
// overview exists only on the dev server by default (showcase: 'dev'), so its tests use one.
// `--ignore-lock` keeps `astro preview`/`dev` in the foreground; Astro backgrounds them when run by
// an agent.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}${base}` },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /showcase\.spec\.ts/,
    },
    {
      name: 'dev server',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${devPort}${base}` },
      testMatch: /showcase\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: `pnpm --filter elucidate-starter preview --port ${port} --ignore-lock`,
      url: `http://localhost:${port}${base}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter elucidate-starter dev --port ${devPort} --ignore-lock`,
      url: `http://localhost:${devPort}${base}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
