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

async function openFraudReview(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /bắt đầu/i }).click();
  await expect(page.getByRole("heading", { name: /giao dịch bất thường vừa bị chặn/i })).toBeVisible();
  await page.getByRole("button", { name: /mở co-opbank/i }).click();
  await expect(page.getByRole("heading", { name: /cảnh báo AI khẩn cấp/i })).toBeVisible();
  await page.getByRole("button", { name: /xem cảnh báo/i }).click();
  await expect(page.getByRole("heading", { name: /KNIGHT đã tạm khóa thẻ số/i })).toBeVisible();
  await expect(page.getByText("847/1000")).toBeVisible();
  await expect(page.getByText(/10\.000\.000/).first()).toBeVisible();
}

test.describe("KNIGHT mobile/PWA prototype", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?env=test");
  });

  test("hides the account balance by default until the user reveals it", async ({ page }) => {
    await page.goto("/?env=test&capture=phone&shot=case");

    await expect(page.getByText(/36\.360\.430/)).toHaveCount(0);

    await page.locator(".balance-toggle").click();

    await expect(page.getByText(/36\.360\.430/)).toBeVisible();
  });

  test("keeps the one-time card visible before returning to bank home", async ({ page }, testInfo) => {
    await openFraudReview(page);

    await page.getByRole("button", { name: /không phải tôi/i }).click();
    await expect(page.getByRole("heading", { name: /xác thực để khóa thẻ cũ/i })).toBeVisible();
    await expect(page.getByText(/kiểm tra liveness/i)).toBeVisible();

    await page.getByRole("button", { name: /xác thực face id/i }).click();
    await expect(page.getByRole("heading", { name: /thẻ số mới đã sẵn sàng/i })).toBeVisible();
    await expect(page.getByLabel(/Demo virtual card/i)).toBeVisible();
    await expect(page.getByLabel(/One-time emergency virtual card/i)).toBeVisible();
    await expect(page.getByText("4221 0982 7361 8839")).toBeVisible();
    await expect(page.getByRole("heading", { name: /bắt đầu phục hồi/i })).toHaveCount(0);

    await page.getByRole("button", { name: /trang chủ ngân hàng/i }).click();
    await expect(page.getByRole("heading", { name: /thẻ số của tôi/i })).toBeVisible();
    await expect(page.getByText("4532 **** **** 7291")).toBeVisible();
    await expect(page.getByRole("heading", { name: /bắt đầu phục hồi/i })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("new-card-home-flow.png"), fullPage: true });
  });

  test("keeps legitimate and timeout branches inside policy boundaries", async ({ page }, testInfo) => {
    await openFraudReview(page);
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

  test("runs GuardianFlow Decision Intelligence demo scenarios", async ({ page }) => {
    await page.evaluate(() => window.sessionStorage.setItem("knight_guardianflow_consent", "withdrawn"));
    await page.goto("/?env=test&capture=phone&shot=case&demo=true&controls=0");

    await page.getByRole("button", { name: /hộ vệ ai/i }).click();
    await expect(page.getByRole("heading", { name: /KNIGHT Decision Intelligence/i })).toBeVisible();
    await page.evaluate(() => {
      const toggle = document.querySelector('input[aria-label="Kích hoạt Hộ vệ AI KNIGHT"]') as HTMLInputElement;
      if (toggle) toggle.click();
    });

    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
      const consentCheckbox = checkboxes.find(c => c.parentElement?.textContent?.includes("đồng ý"));
      if (consentCheckbox) consentCheckbox.click();
    });

    await page.getByRole("button", { name: /đồng ý và kích hoạt/i }).click();

    await page.getByLabel(/scenario/i).selectOption("critical_risk");
    await page.getByRole("button", { name: /chạy scenario/i }).click();

    await expect(page.getByRole("heading", { name: /giao dịch tạm thời bị giữ lại/i })).toBeVisible();
    await expect(page.getByText(/GF-CRITICAL_RISK-001/i)).toBeVisible();
    await page.getByRole("button", { name: /xem chi tiết phân tích/i }).click();
    await expect(page.getByLabel(/GuardianFlow agent console/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps bank logos legible in the compact transfer picker", async ({ page }) => {
    await page.goto("/?env=test&capture=phone&shot=case&controls=0");

    await page
      .getByRole("navigation", { name: /thanh điều hướng chính/i })
      .getByRole("button", { name: /chuyển tiền/i })
      .click();
    await page.getByRole("button", { name: /ngân hàng thụ hưởng/i }).click();
    await page.getByRole("combobox", { name: /tìm ngân hàng/i }).fill("viet");

    await expect(
      page.getByRole("option", { name: /vietcombank ngân hàng tmcp ngoại thương việt nam/i }),
    ).toBeVisible();

    const logoImageBox = await page.locator(".bank-sheet__option .bank-sheet__logo img").first().boundingBox();
    const logoShellBox = await page.locator(".bank-sheet__option .bank-sheet__logo").first().boundingBox();

    expect(logoImageBox?.width ?? 0).toBeGreaterThanOrEqual(34);
    expect(logoShellBox?.width ?? 0).toBeLessThanOrEqual(46);

    await page.getByRole("option", { name: /vietcombank ngân hàng tmcp ngoại thương việt nam/i }).click();
    await expect(
      page.getByRole("button", { name: /ngân hàng thụ hưởng vietcombank ngân hàng tmcp ngoại thương việt nam/i }),
    ).toBeVisible();

    const triggerLogoImageBox = await page.locator(".bank-picker__trigger .bank-picker__logo img").boundingBox();
    const triggerLogoBox = await page.locator(".bank-picker__trigger .bank-picker__logo").boundingBox();
    const triggerBox = await page.locator(".bank-picker__trigger").boundingBox();

    expect(triggerLogoImageBox?.width ?? 0).toBeGreaterThanOrEqual(58);
    expect(triggerLogoBox?.width ?? 0).toBeLessThanOrEqual(78);
    expect(triggerBox?.height ?? 0).toBeLessThanOrEqual(72);
    await expectNoHorizontalOverflow(page);
  });

  test("renders required video shots across iPhone viewports", async ({ page }, testInfo) => {
    const shots = [
      { name: "alert", url: "/?env=test&capture=phone&shot=reason&controls=0", text: /giao dịch bất thường vừa bị chặn/i },
      { name: "fraud-review", url: "/?env=test&capture=phone&shot=fraud-review&controls=0", text: /KNIGHT đã tạm khóa thẻ số/i },
      { name: "faceid", url: "/?env=test&capture=phone&shot=faceid&controls=0", text: /kiểm tra liveness/i },
      { name: "card", url: "/?env=test&capture=phone&shot=card&controls=0", text: /thẻ số mới đã sẵn sàng/i },
      { name: "case-home", url: "/?env=test&capture=phone&shot=case&controls=0", text: /thẻ số của tôi/i },
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
