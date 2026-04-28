import { expect, test } from '@playwright/test';

test('web search renders AhorroYA and supports fallback catalog', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/AhorroYA/i).first()).toBeVisible();
  await page.getByPlaceholder(/buscar/i).fill('leche');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Leche/i).first()).toBeVisible();
});
