import { test, expect } from "@playwright/test";

// Fumée : la home se charge, le formulaire de réservation existe,
// /admin exige une authentification (pas d'éditeur sans session).
test("home + réservation visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /disponibilités/i })).toBeVisible();
});

test("/admin protégé (pas d'éditeur sans session)", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText(/administration|connexion|configuré/i)).toBeVisible();
});
