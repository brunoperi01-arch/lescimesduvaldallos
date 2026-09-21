import { describe, it, expect } from "vitest";
import { statusReport, statusExitCode } from "../status.js";
import { dbTestUrl } from "../dbTestGuard.js";

describe("statusReport", () => {
  const files = [{ filename: "0001_init.sql", checksum: "a" }, { filename: "0002_x.sql", checksum: "b" }, { filename: "0003_y.sql", checksum: "c" }];
  it("classe appliqué / en attente / divergent / fichier manquant + checksums", () => {
    const r = statusReport(files, [{ filename: "0001_init.sql", checksum: "a" }, { filename: "0002_x.sql", checksum: "DIFF" }, { filename: "0000_old.sql", checksum: "z" }]);
    const by = Object.fromEntries(r.map((x) => [x.filename, x]));
    expect(by["0001_init.sql"].state).toBe("applied");
    expect(by["0002_x.sql"].state).toBe("divergent");
    expect(by["0002_x.sql"].local).toBe("b"); expect(by["0002_x.sql"].recorded).toBe("DIFF");
    expect(by["0003_y.sql"].state).toBe("pending");
    expect(by["0000_old.sql"].state).toBe("missing_file");
  });
});

describe("statusExitCode", () => {
  it("0 si tout appliqué/pending", () => { expect(statusExitCode([{ state: "applied" }, { state: "pending" }])).toBe(0); });
  it("1 si divergence", () => { expect(statusExitCode([{ state: "divergent" }])).toBe(1); });
  it("1 si fichier appliqué manquant", () => { expect(statusExitCode([{ state: "missing_file" }])).toBe(1); });
});

describe("dbTestUrl (marqueur canonique)", () => {
  const base = { ALLOW_DB_TESTS: "1", TEST_DATABASE_URL: "postgres://runtime:p@h:5432/cimes_test", TEST_DATABASE_ADMIN_URL: "postgres://admin:p@h:5432/cimes_test", TEST_DATABASE_MARKER: "h:5432/cimes_test" };
  it("accepte si marqueur == empreinte canonique", () => { expect(dbTestUrl(base)).toBe(base.TEST_DATABASE_URL); });
  it("refuse sans marqueur", () => { expect(dbTestUrl({ ...base, TEST_DATABASE_MARKER: undefined })).toBeNull(); });
  it("refuse si le marqueur ne correspond pas", () => { expect(dbTestUrl({ ...base, TEST_DATABASE_MARKER: "h:5432/autre" })).toBeNull(); });
  it("refuse 'test' dans le nom sans marqueur", () => { expect(dbTestUrl({ ALLOW_DB_TESTS: "1", TEST_DATABASE_URL: "postgres://h:5432/x_test" })).toBeNull(); });
  it("refuse la prod même avec marqueur", () => {
    expect(dbTestUrl({ ...base, DATABASE_URL: "postgres://other@h:5432/cimes_test" })).toBeNull();
  });
  it("refuse admin et runtime sur des bases différentes", () => {
    expect(dbTestUrl({ ...base, TEST_DATABASE_ADMIN_URL: "postgres://admin:p@h:5432/autre" })).toBeNull();
  });
  it("refuse le même utilisateur admin et runtime", () => {
    expect(dbTestUrl({ ...base, TEST_DATABASE_ADMIN_URL: "postgres://runtime:p@h:5432/cimes_test" })).toBeNull();
  });
});
