import { test, expect } from '@playwright/test';

test.describe('Compare test-sim mode', () => {
  test('hydrates from TBOM payload', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tbomComparePayload',
        JSON.stringify({
          runId: 'R-EX-001',
          projectId: 'P-EX-001',
          testId: 'T-EX-001',
          channels: [
            { channel: 'ACC_TOP_Z', unit: 'g', sampleRate: 200, min: -0.2, max: 0.2 },
          ],
          generatedAt: new Date().toISOString(),
        }),
      );
    });

    await page.goto('/?module=compare&from=tbom&runId=R-EX-001&testId=T-EX-001&projectId=P-EX-001');

    await expect(page.getByText('来自 TBOM 的运行上下文')).toBeVisible();

    await page.getByRole('heading', { name: '对比中心' }).waitFor();
    const modeSelect = page.locator('select').first();
    await modeSelect.selectOption('test-sim');

    await expect(page.getByText(/试验 \/ 仿真数据源/)).toBeVisible();
    await expect(page.getByText('运行 R-EX-001 · 试验 T-EX-001')).toBeVisible();
  });
});
