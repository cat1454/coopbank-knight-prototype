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
    await page.goto("/?env=test");
  });

  test("runs explainable trust recovery after securing the account", async ({ page }, testInfo) => {
    await page.getByRole("button", { name: /bắt đầu/i }).click();
    await expect(page.getByRole("heading", { name: /giao dịch bất thường vừa bị chặn/i })).toBeVisible();
    await page.getByRole("button", { name: /mở co-opbank/i }).click();
    await expect(page.getByRole("heading", { name: /KNIGHT đã tạm khóa thẻ số/i })).toBeVisible();
    await expect(page.getByText("847/1000")).toBeVisible();
    await expect(page.getByText(/10\.000\.000/).first()).toBeVisible();

    await page.getByRole("button", { name: /không phải tôi/i }).click();
    await expect(page.getByRole("heading", { name: /xác thực để khóa thẻ cũ/i })).toBeVisible();
    await expect(page.getByText(/kiểm tra liveness/i)).toBeVisible();

    await page.getByRole("button", { name: /xác thực face id/i }).click();
    await expect(page.getByRole("heading", { name: /hồ sơ tra soát đã gửi/i })).toBeVisible();
    await expect(page.getByText("FR-20250601-001")).toBeVisible();

    await page.getByRole("button", { name: /chuyển sang sáng hôm sau/i }).click();
    await expect(page.getByRole("heading", { name: /bắt đầu phục hồi niềm tin đúng thời điểm/i })).toBeVisible();

    await page.getByRole("button", { name: /mở phiên phục hồi buổi sáng/i }).click();
    await expect(page.getByRole("heading", { name: /\[observe\] hành vi sau sự cố/i })).toBeVisible();
    await expect(page.getByText("6 lần từ sáng sớm")).toBeVisible();

    await page.getByRole("button", { name: /đánh giá nhu cầu phục hồi niềm tin/i }).click();
    await expect(page.getByRole("heading", { name: /điểm nhu cầu phục hồi: 82\/100/i })).toBeVisible();
    await expect(page.getByText(/ngưỡng kích hoạt/i)).toBeVisible();

    await page.getByRole("button", { name: /kích hoạt gói phục hồi an tâm/i }).click();
    await expect(page.getByRole("heading", { name: /gói phục hồi an tâm đã được kích hoạt/i })).toBeVisible();
    await expect(page.getByText(/bảo vệ tài khoản 30 ngày/i)).toBeVisible();

    await page.getByRole("button", { name: /kích hoạt hoàn tiền thiết yếu/i }).click();
    await expect(page.getByText(/khách hàng quay lại thanh toán điện/i).first()).toBeVisible();
    await expect(page.getByText(/recovery react cycle complete/i)).toBeVisible();

    await page.getByRole("button", { name: /hoàn tất & về trang chủ/i }).click();
    await expect(page.getByRole("heading", { name: /Hiệp sĩ số bảo vệ thẻ/i })).toBeVisible();
    await expect(page.getByText(/KNIGHT AI v2\.0/i)).toBeAttached();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("full-fraud-personalization-audit.png"), fullPage: true });
  });

  test("keeps legitimate and timeout branches inside policy boundaries", async ({ page }, testInfo) => {
    await page.getByRole("button", { name: /bắt đầu/i }).click();
    await page.getByRole("button", { name: /mở co-opbank/i }).click();
    await page.getByRole("button", { name: /đây là giao dịch của tôi/i }).click();
    await page.getByRole("button", { name: /xác thực/i }).click();
    await expect(page.getByRole("heading", { name: /thẻ đã được mở lại/i })).toBeVisible();
    await expect(page.locator(".screen").getByText(/giám sát tăng cường trong 30 phút/i)).toBeVisible();
    await expect(page.getByText("FR-20250601-001")).toHaveCount(0);

    await page.goto("/?env=test&capture=phone&shot=timeout");
    await expect(page.getByRole("heading", { name: /Fraud Ops đang xem xét/i })).toBeVisible();
    await expect(page.getByText(/Thẻ vẫn đang tạm khóa/i)).toBeVisible();
    await expect(page.getByText(/hồ sơ tra soát đã gửi/i)).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("policy-branches.png"), fullPage: true });
  });

  test("supports capture modes for video recording", async ({ page }) => {
    await page.goto("/?env=test&capture=phone&shot=assessment&controls=0");
    await expect(page.getByRole("heading", { name: /điểm nhu cầu phục hồi: 82\/100/i })).toBeVisible();
    await expect(page.getByLabel("Demo controls")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await page.goto("/?env=test&capture=agent&shot=recovery&controls=0");
    await expect(page.getByLabel(/KNIGHT animated agent/i)).toBeVisible();
    await expect(page.getByText(/Recovery evidence observed/i).last()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("renders required video shots across iPhone viewports", async ({ page }, testInfo) => {
    const shots = [
      { name: "alert", url: "/?env=test&capture=phone&shot=reason&controls=0", text: /giao dịch bất thường vừa bị chặn/i },
      { name: "fraud-review", url: "/?env=test&capture=phone&shot=fraud-review&controls=0", text: /KNIGHT đã tạm khóa thẻ số/i },
      { name: "faceid", url: "/?env=test&capture=phone&shot=faceid&controls=0", text: /kiểm tra liveness/i },
      { name: "case", url: "/?env=test&capture=phone&shot=case&controls=0", text: /hồ sơ tra soát đã gửi/i },
      { name: "behavior", url: "/?env=test&capture=phone&shot=behavior&controls=0", text: /\[observe\] hành vi sau sự cố/i },
      { name: "assessment", url: "/?env=test&capture=phone&shot=assessment&controls=0", text: /điểm nhu cầu phục hồi: 82\/100/i },
      { name: "package", url: "/?env=test&capture=phone&shot=package&controls=0", text: /gói phục hồi an tâm đã được kích hoạt/i },
      { name: "recovery-agent", url: "/?env=test&capture=agent&shot=recovery&controls=0", text: /Recovery evidence observed/i },
    ];

    for (const shot of shots) {
      await page.goto(shot.url);
      const shotText = shot.name === "recovery-agent" ? page.getByText(shot.text).last() : page.getByText(shot.text).first();
      await expect(shotText).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`${testInfo.project.name}-${shot.name}.png`),
        fullPage: true,
      });
    }
  });

  test("does not persist sensitive demo state in localStorage or show forbidden card data", async ({ page }) => {
    await page.goto("/?env=test&capture=phone&shot=recovery");

    const localStorageLength = await page.evaluate(() => window.localStorage.length);
    const pageText = await page.locator("body").innerText();

    expect(localStorageLength).toBe(0);
    expect(pageText).not.toMatch(/\b\d{13,19}\b/);
    expect(pageText.toLowerCase()).not.toContain("cvv");
    expect(pageText.toLowerCase()).not.toContain("api_key");
    expect(pageText.toLowerCase()).not.toContain("secret");
  });
});
