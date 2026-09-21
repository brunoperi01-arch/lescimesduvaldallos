import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:4173" },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "npm run build:e2e && npm run preview -- --port 4173",
    port: 4173, reuseExistingServer: true, timeout: 120000,
  },
});
