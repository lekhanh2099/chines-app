import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001";

export default defineConfig({
 testDir: "./e2e",
 fullyParallel: false,
 forbidOnly: Boolean(process.env.CI),
 retries: process.env.CI ? 2 : 0,
 workers: 1,
 reporter: process.env.CI ? "github" : "list",
 use: {
  baseURL,
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
  video: "retain-on-failure",
  locale: "vi-VN",
  ...devices["Desktop Chrome"],
  launchOptions: {
   args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
 },
 webServer: {
  command: "npm run build && npm run start -- -p 3001",
  url: baseURL,
  reuseExistingServer: !process.env.CI,
  timeout: 300_000,
  stdout: "ignore",
  stderr: "pipe",
 },
});
