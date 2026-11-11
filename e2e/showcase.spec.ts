import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, horizontalOverflow } from './axe.ts';

// Runs against the dev server: the component overview is a development page by default.

for (const width of [375, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`component overview at ${width}px, ${colorScheme}: no overflow, no axe violations`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('components/');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Components');
      expect(await horizontalOverflow(page)).toBe(0);
      await expectNoAxeViolations(page);
    });
  }
}

test('lists every built-in component and the site’s own, with examples and sources', async ({
  page,
}) => {
  await page.goto('components/');
  for (const name of ['Figure', 'Block', 'Aside', 'Note', 'Button', 'Overlay', 'Definition']) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const definition = page.locator('#definition');
  await expect(definition.locator('dfn')).toHaveText('Momentum');
  await definition.getByText('Source').click();
  await expect(definition.locator('pre')).toContainText('<Definition term="Momentum">');
});

test('a dialog overlay closes on a backdrop click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('components/');
  await page.getByRole('button', { name: 'Open the overlay' }).click();
  const dialog = page.getByRole('dialog', { name: 'An overlay' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/#showcase-overlay$/);
  await page.mouse.click(20, 450);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open the overlay' })).toBeFocused();
});
