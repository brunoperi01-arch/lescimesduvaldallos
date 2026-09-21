import { describe, it, expect } from "vitest";
import { runMigrations, migrationId, sha256 } from "../migrate.js";

// Faux client pg : journalise les requêtes, permet de simuler une erreur d'insert.
function fakeClient({ failInsert = false, existing = [] } = {}) {
  const c = { queries: [], tx: [], stored: [...existing] };
  c.query = async (text, params) => {
    c.queries.push({ text, params });
    if (/^(begin|commit|rollback)/i.test(text.trim())) { c.tx.push(text.trim().toUpperCase()); return { rows: [] }; }
    if (/pg_advisory_lock|pg_advisory_unlock/i.test(text)) { c.locks = (c.locks||[]).concat(text); return { rows: [] }; }
    if (/create table if not exists public\.cimes_schema_migrations/i.test(text)) return { rows: [] };
    if (/^select filename, checksum/i.test(text.trim())) return { rows: c.stored };
    if (/^insert into public\.cimes_schema_migrations/i.test(text.trim())) {
      if (failInsert) throw new Error("insert boom");
      c.stored.push({ filename: params[0], checksum: params[1] }); return { rows: [] };
    }
    return { rows: [] }; // exécution du corps de migration
  };
  return c;
}

const PLPGSQL = "0002_x.sql body\ncreate function f() returns void language plpgsql as $$\nbegin\n  perform 1; perform 2; perform 3;\nend $$;";

describe("runner de migrations", () => {
  it("exécute le FICHIER COMPLET en une seule requête (pas de découpage sur ';')", async () => {
    const c = fakeClient();
    const body = PLPGSQL;
    await runMigrations({ client: c, files: [{ filename: "0001_init.sql", body }] });
    // le corps est passé tel quel, une seule fois
    const bodyCalls = c.queries.filter((q) => q.text === body);
    expect(bodyCalls.length).toBe(1);
  });

  it("migration + checksum sont atomiques (ROLLBACK si l'insert échoue)", async () => {
    const c = fakeClient({ failInsert: true });
    await expect(runMigrations({ client: c, files: [{ filename: "0001_init.sql", body: "x" }] })).rejects.toThrow();
    expect(c.tx).toContain("BEGIN");
    expect(c.tx).toContain("ROLLBACK");
    expect(c.tx).not.toContain("COMMIT");
    expect(c.stored.length).toBe(0); // rien enregistré
  });

  it("refuse un checksum différent pour une migration déjà appliquée", async () => {
    const c = fakeClient({ existing: [{ filename: "0001_init.sql", checksum: "autre" }] });
    await expect(runMigrations({ client: c, files: [{ filename: "0001_init.sql", body: "nouveau" }] })).rejects.toThrow(/checksum modifié/);
  });

  it("ignore une migration déjà appliquée au même checksum", async () => {
    const body = "abc"; const c = fakeClient({ existing: [{ filename: "0001_init.sql", checksum: sha256(body) }] });
    const res = await runMigrations({ client: c, files: [{ filename: "0001_init.sql", body }] });
    expect(res[0].status).toBe("skipped");
  });

  it("refuse deux migrations au même identifiant", async () => {
    const c = fakeClient();
    await expect(runMigrations({ client: c, files: [
      { filename: "0001_a.sql", body: "x" }, { filename: "0001_b.sql", body: "y" },
    ] })).rejects.toThrow(/dupliqué/);
  });

  it("refuse un nom de fichier invalide", () => {
    expect(() => migrationId("init.sql")).toThrow(/invalide/);
  });

  it("acquiert un verrou global anti-concurrence", async () => {
    const c = fakeClient();
    await runMigrations({ client: c, files: [{ filename: "0001_init.sql", body: "x" }] });
    expect((c.locks || []).some((q) => /pg_advisory_lock/i.test(q))).toBe(true);
    expect((c.locks || []).some((q) => /pg_advisory_unlock/i.test(q))).toBe(true);
  });

  it("configure lock_timeout via set_config paramétré (SQL valide, non masqué)", async () => {
    const c = fakeClient();
    await runMigrations({ client: c, files: [{ filename: "0001_init.sql", body: "x" }] });
    const cfg = c.queries.find((q) => /set_config/i.test(q.text));
    expect(cfg).toBeTruthy();
    expect(cfg.params).toEqual(["5s"]);
    expect(c.queries.some((q) => /lock_timeout = ''/i.test(q.text))).toBe(false); // plus de SQL invalide
  });
});
