import { describe, it, expect } from "vitest";
import { chooseContentSource } from "../contentSource";

describe("chooseContentSource", () => {
  it("mode e2e -> e2e (fixture)", () => {
    expect(chooseContentSource({ isDev: false, mode: "e2e" })).toBe("e2e");
  });

  it("dev avec fallback autorisé -> file", () => {
    expect(chooseContentSource({ isDev: true, allowFallback: true })).toBe("file");
  });
  it("prod ou dev sans fallback -> api", () => {
    expect(chooseContentSource({ isDev: false, allowFallback: false })).toBe("api");
    expect(chooseContentSource({ isDev: true, allowFallback: false })).toBe("api");
  });
});
