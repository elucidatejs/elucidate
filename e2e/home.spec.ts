import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('placeholder home page renders without axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elucidate');
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
