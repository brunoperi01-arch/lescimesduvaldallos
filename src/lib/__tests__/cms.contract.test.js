import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveDraft, publish, restore } from "../cms";
import { setCsrf } from "../apiClient";

let calls;
beforeEach(() => {
  calls = [];
  setCsrf("csrf-token");
  globalThis.fetch = vi.fn(async (url, opts) => {
    calls.push({ url, method: opts.method, body: opts.body ? JSON.parse(opts.body) : null, headers: opts.headers });
    return { ok: true, status: 200, json: async () => ({ draftRevision: 3, version: 4 }) };
  });
});

describe("contrat frontend -> API", () => {
  it("saveDraft envoie { content, expectedVersion } en PUT /admin/content/draft", async () => {
    await saveDraft({ a: 1 }, 2, 1);
    expect(calls[0].url).toBe("/api/admin/content/draft");
    expect(calls[0].method).toBe("PUT");
    expect(calls[0].body).toEqual({ content: { a: 1 }, expectedPublishedVersion: 1, expectedDraftRevision: 2 });
    expect(calls[0].headers["x-csrf-token"]).toBe("csrf-token");
  });
  it("publish envoie { expectedVersion } en POST /admin/content/publish", async () => {
    await publish(1, 2);
    expect(calls[0].url).toBe("/api/admin/content/publish");
    expect(calls[0].body).toEqual({ expectedPublishedVersion: 1, expectedDraftRevision: 2 });
  });
  it("restore envoie { versionId, expectedVersion } en POST /admin/content/restore", async () => {
    await restore(4, 6, "12");
    expect(calls[0].body).toEqual({ versionId: "12", expectedPublishedVersion: 4, expectedDraftRevision: 6 });
  });
});
