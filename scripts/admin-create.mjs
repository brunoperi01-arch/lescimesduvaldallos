// Crée un administrateur (DATABASE_ADMIN_URL). E-mail/mot de passe via variables
// d'env ADMIN_EMAIL/ADMIN_PASSWORD (non journalisés).
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../server/auth.js";
const url = process.env.DATABASE_ADMIN_URL, email = (process.env.ADMIN_EMAIL || "").toLowerCase(), pwd = process.env.ADMIN_PASSWORD;
if (!url || !email || !pwd) { console.error("DATABASE_ADMIN_URL, ADMIN_EMAIL, ADMIN_PASSWORD requis"); process.exit(1); }
const sql = neon(url);
const hash = await hashPassword(pwd);
await sql`insert into cimes_admins(email, password_hash) values(${email}, ${hash})
  on conflict (email) do update set password_hash = excluded.password_hash`;
console.log("Administrateur prêt :", email);
