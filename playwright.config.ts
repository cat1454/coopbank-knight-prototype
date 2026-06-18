import { defineConfig, devices } from "@playwright/test";

process.env.PLAYWRIGHT_FORCE_TTY ??= "0";

const PORT = 4173;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "iphone-390x844",
      use: { ...devices["iPhone 12"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "iphone-393x852",
      use: { ...devices["iPhone 14"], viewport: { width: 393, height: 852 } },
    },
    {
      name: "iphone-430x932",
      use: { ...devices["iPhone 15 Pro Max"], viewport: { width: 430, height: 932 } },
    },
    {
      name: "stress-360x780",
      use: { ...devices["Pixel 5"], viewport: { width: 360, height: 780 } },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
