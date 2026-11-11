import { defineConfig, devices } from '@playwright/test';
import { base } from './e2e/site.ts';

const port = 4322;

// E2E tests run against the production build of starter/ (run `pnpm build` first).
// `--ignore-lock` keeps `astro preview` in the foreground; Astro backgrounds it when run by an agent.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}${base}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm --filter elucidate-starter preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}${base}`,
    reuseExistingServer: !process.env.CI,
  },
});
