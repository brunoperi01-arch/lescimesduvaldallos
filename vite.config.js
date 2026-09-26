import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { SITE_URL } from "./src/lib/siteSeo.js";
export default defineConfig({
  plugins: [react(), {
    name: "site-canonical",
    transformIndexHtml: {
      order: "pre",
      handler(html) { return html.replaceAll("%SITE_CANONICAL%", SITE_URL); },
    },
  }],
});
