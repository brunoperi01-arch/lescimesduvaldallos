// Seed idempotent depuis public/content.json (DATABASE_ADMIN_URL).
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { validateContent, checkPublishable } from "../src/lib/contentSchema.js";
const url = process.env.DATABASE_ADMIN_URL;
if (!url) { console.error("DATABASE_ADMIN_URL requis"); process.exit(1); }
const content = JSON.parse(readFileSync(new URL("../public/content.json", import.meta.url)));
const v = validateContent(content);
if (!v.success) { console.error("content.json invalide", v.error.issues.slice(0, 3)); process.exit(1); }
const publishable = checkPublishable(content).length === 0;
const sql = neon(url);
const [{ cimes_seed: status }] = await sql`select cimes_seed(${JSON.stringify(content)}::jsonb, ${publishable})`;
console.log("Seed:", status, publishable ? "" : "(non publiable — médiateur/mentions manquants)");
