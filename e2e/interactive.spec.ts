import { expect, type Page, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe.ts';

const article = 'research/a-tour-of-elucidate/';
const figure = '[id="fig:momentum"]';

/** Stroke colors of the paths in a plot, momentum first. */
const pathColors = (page: Page, root: string) =>
  page
    .locator(`${root} .momentum__plot path`)
    .evaluateAll((paths) => paths.map((path) => path.getAttribute('stroke')).reverse());

/** Moves the pointer onto step `index` of the path with momentum. */
async function hoverStep(page: Page, root: string, index: number): Promise<void> {
  const point = await page.locator(`${root} .momentum__plot`).evaluate((plot, i) => {
    const circles = [...plot.querySelectorAll('circle')].filter(
      (c) =>
        c.getAttribute('fill') === plot.querySelector('path:last-of-type')?.getAttribute('stroke'),
    );
    const box = (circles[i] as Element).getBoundingClientRect();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }, index);
  await page.mouse.move(point.x, point.y);
}

test('the interactive figure draws with the data palette and follows the theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(article);
  await expect.poll(() => pathColors(page, figure)).toEqual(['#0571b0', '#b97f02']);
  await page.locator('[data-el-theme-toggle]').click();
  await expect.poll(() => pathColors(page, figure)).toEqual(['#2c8acc', '#c18503']);
});

test('the controls redraw the figure and its readout', async ({ page }) => {
  await page.goto(article);
  const readout = page.locator(`${figure} [data-readout]`);
  await expect(readout).toContainText('34 steps with momentum, 133 steps without');
  await page.locator(`${figure} [data-beta]`).fill('0.5');
  await expect(readout).toContainText('58 steps with momentum');
  await page.locator(figure).getByRole('radio', { name: '0.1', exact: true }).check();
  await expect(readout).toContainText('19 steps with momentum, 65 steps without');
  await page.locator(figure).getByRole('switch').uncheck();
  await expect(readout).not.toContainText('without');
  await expect.poll(() => pathColors(page, figure)).toHaveLength(1);
});

test('hovering a step or using the arrow keys shows its value', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(article);
  const tip = page.locator(`${figure} [data-tip]`);
  await page.locator(figure).scrollIntoViewIfNeeded();
  await hoverStep(page, figure, 3);
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText(/^With momentum, step 3: f = /);
  await page.mouse.move(5, 5);
  await expect(tip).toBeHidden();
  await page.locator(`${figure} .momentum__plot`).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(tip).toHaveText(/^With momentum, step 1: f = /);
});

test('the overlay opens from its button, sets the hash and returns focus when closed', async ({
  page,
}) => {
  await page.goto(article);
  const trigger = page.getByRole('button', { name: 'Open the explorer' });
  const dialog = page.getByRole('dialog', { name: 'Momentum explorer' });
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/#explorer$/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/#explorer/);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('a link to the overlay opens it, and Back closes it', async ({ page }) => {
  await page.goto(article);
  await page.getByRole('link', { name: 'a link to #explorer' }).click();
  const dialog = page.getByRole('dialog', { name: 'Momentum explorer' });
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeHidden();
});

test('loading the URL with the hash opens the overlay; its tooltip floats above it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${article}#explorer`);
  const dialog = page.getByRole('dialog', { name: 'Momentum explorer' });
  await expect(dialog).toBeVisible();
  await expectNoAxeViolations(page);
  await hoverStep(page, '#explorer', 5);
  const tip = page.locator('#explorer [data-tip]');
  await expect(tip).toBeVisible();
  // The tooltip is in the top layer, above the modal dialog: it is what the window shows there.
  const onTop = await tip.evaluate((element) => {
    element.style.pointerEvents = 'auto';
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    element.style.pointerEvents = '';
    return hit === element;
  });
  expect(onTop).toBe(true);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/#explorer/);
});

test('asides sit in the margin on wide screens and inline on narrow ones', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(article);
  const aside = page.locator('.el-aside__body').first();
  const paragraph = page.locator('.el-aside + p').first();
  const [asideBox, textBox] = [await aside.boundingBox(), await paragraph.boundingBox()];
  expect(asideBox?.x).toBeGreaterThan((textBox?.x ?? 0) + (textBox?.width ?? 0));
  expect(Math.abs((asideBox?.y ?? 0) - (textBox?.y ?? 0))).toBeLessThan(12);

  await page.setViewportSize({ width: 375, height: 800 });
  const [narrowAside, narrowText] = [await aside.boundingBox(), await paragraph.boundingBox()];
  expect(narrowAside?.y ?? 0).toBeLessThan(narrowText?.y ?? 0);
  expect(Math.abs((narrowAside?.x ?? 0) - (narrowText?.x ?? 0))).toBeLessThan(24);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the interactive figure shows its fallback image and the overlay its content', async ({
    page,
  }) => {
    await page.goto(article);
    await expect(page.locator(`${figure} .el-figure__fallback img`)).toBeVisible();
    await expect(page.locator(`${figure} .momentum`)).toBeHidden();
    await expect(page.locator('#explorer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open the explorer' })).toBeHidden();
  });
});

test('in print, the interactive figure is replaced by its fallback image', async ({ page }) => {
  await page.goto(article);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator(`${figure} .el-figure__fallback img`)).toBeVisible();
  await expect(page.locator(`${figure} .momentum`)).toBeHidden();
});
