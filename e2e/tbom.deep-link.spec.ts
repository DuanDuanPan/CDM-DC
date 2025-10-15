import { test, expect } from '@playwright/test';

test.describe('TBOM deep link experience', () => {
  test('exposes structure filter entry when navigating from EBOM', async ({ page }) => {
    await page.goto('/?from=ebom&node=EBN-ASSY-0001-003');

    const filterRegion = page.getByRole('region', {
      name: '结构节点过滤入口',
    });

    await expect(filterRegion).toBeVisible();
    await expect(filterRegion.getByText('按结构节点过滤')).toBeVisible();
    await expect(filterRegion.getByText('当前节点：EBN-ASSY-0001-003')).toBeVisible();
    await expect(page.getByRole('button', { name: '查看挂接试验，计数 3' })).toBeVisible();
  });
});
