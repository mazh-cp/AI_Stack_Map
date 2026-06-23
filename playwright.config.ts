import { defineConfig, devices } from "@playwright/test";

// End-to-end config. Run with:
//   npm install && npx playwright install chromium
//   npm run test:e2e
//
// Starts the Vite dev server automatically. With the backend also running the
// spec exercises the login flow; without it the app is in local mode and the
// spec skips login — either way it verifies navigation + rendering.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
