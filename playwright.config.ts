import { defineConfig, devices } from "@playwright/test";
// Runs against the screenshot studio: the real dashboard and widget code with
// Wix modules replaced by in-memory mocks (see screenshots/src/wix-*.ts).
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4333",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "ASTRO_TELEMETRY_DISABLED=1 npx astro dev --config astro.shots.config.mjs",
    url: "http://127.0.0.1:4333",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
