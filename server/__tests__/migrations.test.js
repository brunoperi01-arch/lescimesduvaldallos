import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const dir = new URL("../../neon/migrations/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));

describe("migrations Neon", () => {
  it("aucun rôle Supabase (service_role/anon/authenticated) ciblé par GRANT/REVOKE", () => {
    for (const f of files) {
      const body = readFileSync(new URL(f, dir), "utf8");
      const bad = body.match(/\b(grant|revoke)\b[\s\S]*?\b(to|from)\s+(service_role|anon|authenticated)\b/gi);
      expect(bad, `${f} contient un rôle Supabase : ${bad}`).toBeNull();
    }
  });
  it("checksums 0001-0003 gelés inchangés", () => {
    const sha = (f) => createHash("sha256").update(readFileSync(new URL(f, dir), "utf8")).digest("hex");
    expect(sha("0001_init.sql")).toBe("6f87a17a793fb91c483327a606d04df24011b4cedace76809ba567b82711896e");
    expect(sha("0002_security_core.sql")).toBe("358e6def890d6500d1708810beeee1f6a911910b1e4d51b8d3fbb60d0eba1d11");
    expect(sha("0003_runtime_validation.sql")).toBe("df0c9d2d075cc317215b21a6c45a8359bba9444fe747e39a4a244e80eadc7658");
  });
  it("0006 retire l'audit générique et les écritures directes de session/audit", () => {
    const body = readFileSync(new URL("0006_runtime_release.sql", dir), "utf8");
    expect(body).toMatch(/revoke insert, update, delete on public\.cimes_sessions from cimes_app/i);
    expect(body).toMatch(/revoke select, insert, update, delete on public\.cimes_audit_log from cimes_app/i);
    expect(body).toMatch(/drop function if exists public\.cimes_log_audit\(text, uuid\)/i);
    expect(body).toMatch(/cimes_create_session/);
    expect(body).toMatch(/cimes_revoke_session/);
  });
});
