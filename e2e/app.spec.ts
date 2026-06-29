import { test, expect } from "@playwright/test";

// Robust against both modes: if the backend is online a login form appears
// (sign in as Owner — the form is pre-filled with demo creds); if it's offline
// the app loads straight into local mode. Routes are lazy-loaded, so assertions
// use generous timeouts.
test("login (if required) then navigate the dashboard", async ({ page }) => {
  await page.goto("/");

  // Wait for startup to settle into either the login form or the dashboard
  // (init() shows a brief "Loading…" while it probes the backend).
  const email = page.getByPlaceholder("you@imbsys.com");
  const dashHeading = page.getByRole("heading", { name: "Security Dashboard" });
  await Promise.race([
    email.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {}),
    dashHeading.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {}),
  ]);

  if (await email.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(email).toBeHidden({ timeout: 15_000 }); // login completed
  }

  // Dashboard (lazy chunk) renders
  await expect(
    page.getByRole("heading", { name: "Security Dashboard" })
  ).toBeVisible({ timeout: 15_000 });

  // Navigate to the Risk Register
  await page.getByRole("link", { name: "Risk Register" }).click();
  await expect(
    page.getByRole("heading", { name: "Risk Register" })
  ).toBeVisible({ timeout: 10_000 });

  // Navigate to Compliance and confirm the frameworks page renders
  await page.getByRole("link", { name: "Compliance" }).click();
  await expect(
    page.getByRole("heading", { name: "Compliance Frameworks" })
  ).toBeVisible({ timeout: 10_000 });
});
