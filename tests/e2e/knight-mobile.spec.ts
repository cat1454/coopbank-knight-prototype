import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const metrics = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
}

test.describe("KNIGHT mobile/PWA prototype", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("runs the fraud recovery flow with audit evidence", async ({ page }, testInfo) => {
    await page.getByRole("button", { name: /bắt đầu/i }).click();
    await expect(page.getByRole("heading", { name: /giao dịch bất thường vừa bị chặn/i })).toBeVisible();
    await page.getByRole("button", { name: /mở co-opbank/i }).click();
    await expect(page.getByRole("heading", { name: /KNIGHT đã tạm khóa thẻ số/i })).toBeVisible();
    await expect(page.getByText("847/1000")).toBeVisible();

    await page.getByRole("button", { name: /không phải tôi/i }).click();
    await expect(page.getByRole("heading", { name: /xác thực để khóa thẻ cũ/i })).toBeVisible();

    await page.getByRole("button", { name: /xác thực/i }).click();
    await expect(page.getByRole("heading", { name: /thẻ số mới đã sẵn sàng/i })).toBeVisible();
    await expect(page.getByText("FR-20250601-001")).toBeVisible();

    await page.getByRole("button", { name: /xem ưu đãi/i }).click();
    await expect(page.getByText(/danh mục chi tiêu đã được bạn cho phép/i)).toBeVisible();

    await page.getByRole("button", { name: /xem timeline/i }).click();
    await expect(page.getByText("Tạm khóa thẻ")).toBeVisible();
    await expect(page.getByText("Terminate + issue new card")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("fraud-audit.png"), fullPage: true });
  });

  test("keeps legitimate and timeout branches inside policy boundaries", async ({ page }, testInfo) => {
    await page.getByRole("button", { name: /bắt đầu/i }).click();
    await page.getByRole("button", { name: /mở co-opbank/i }).click();
    await page.getByRole("button", { name: /đây là giao dịch của tôi/i }).click();
    await page.getByRole("button", { name: /xác thực/i }).click();
    await expect(page.getByRole("heading", { name: /thẻ đã được mở lại/i })).toBeVisible();
    await expect(page.getByText(/giám sát tăng cường trong 30 phút/i)).toBeVisible();
    await expect(page.getByText("FR-20250601-001")).toHaveCount(0);

    await page.getByRole("button", { name: /timeout/i }).click();
    await expect(page.getByRole("heading", { name: /Fraud Ops đang xem xét/i })).toBeVisible();
    await expect(page.getByText(/Thẻ vẫn đang tạm khóa/i)).toBeVisible();
    await expect(page.getByText(/Thẻ số mới đã sẵn sàng/i)).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("policy-branches.png"), fullPage: true });
  });

  test("does not persist sensitive demo state in localStorage or show forbidden card data", async ({ page }) => {
    await page.getByRole("button", { name: /fraud/i }).click();

    const localStorageLength = await page.evaluate(() => window.localStorage.length);
    const pageText = await page.locator("body").innerText();

    expect(localStorageLength).toBe(0);
    expect(pageText).not.toMatch(/\b\d{13,19}\b/);
    expect(pageText.toLowerCase()).not.toContain("cvv");
    expect(pageText.toLowerCase()).not.toContain("api_key");
    expect(pageText.toLowerCase()).not.toContain("secret");
  });
});
