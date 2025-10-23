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

  test('renders TBOM physical banner on dashboard deep link', async ({ page }) => {
    await page.goto('/?module=dashboard&from=tbom&domain=physical&assetSn=SN-0001&runId=R-EX-001');

    const banner = page.getByText('来自 TBOM 的实物追溯');
    await expect(banner).toBeVisible();
    await expect(page.getByRole('button', { name: '返回 TBOM' })).toBeVisible();
    await expect(page.getByText(/试验件序列号：SN-0001/)).toBeVisible();
  });

  test('restores TBOM filters after run-detail navigation', async ({ page }) => {
    await page.goto('/tbom?run=R-EX-001');

    const searchInput = page.getByPlaceholder('搜索项目 / 试验 / 运行 / EBOM 节点');
    await searchInput.fill('SN-0001');
    await searchInput.blur();

    await expect(page.getByRole('button', { name: '查看运行详情' })).toBeVisible();
    await page.getByRole('button', { name: '查看运行详情' }).click();

    const relationButton = page.getByRole('button', { name: /设计\/EBOM/ });
    await expect(relationButton).toBeVisible();
    await relationButton.click();

    await page.waitForURL('**/?module=structure**');
    await expect(page.getByRole('button', { name: '返回 TBOM' })).toBeVisible();
    await page.getByRole('button', { name: '返回 TBOM' }).click();

    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/module=structure/);
    expect(page.url()).not.toContain('/tbom');
    const restoredInput = page.getByPlaceholder('搜索项目 / 试验 / 运行 / EBOM 节点');
    await expect(restoredInput).toHaveValue('SN-0001');
  });
});
