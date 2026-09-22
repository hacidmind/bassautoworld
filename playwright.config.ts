import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "integration.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: `http://127.0.0.1:${process.env.QA_PORT || "3001"}`,
    headless: true,
    launchOptions: {
      executablePath:
        process.env.QA_BROWSER_PATH ||
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
    screenshot: "only-on-failure",
  },
  reporter: "list",
});
