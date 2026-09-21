import { describe, it, expect } from "vitest";
import { move, removeAt, duplicateAt, updateAt } from "../listOps";
import { keyFor } from "../fields";

describe("listOps (immuables)", () => {
  const A = { h: "A" }, B = { h: "B" }, C = { h: "C" };
  it("move ne permute pas les valeurs (les objets suivent)", () => {
    const r = move([A, B, C], 0, 2);
    expect(r.map((x) => x.h)).toEqual(["B", "C", "A"]);
    expect(r[2]).toBe(A);
  });
  it("removeAt supprime l'élément du milieu sans décaler les valeurs", () => {
    const r = removeAt([A, B, C], 1);
    expect(r).toEqual([A, C]);
    expect(r[0]).toBe(A); expect(r[1]).toBe(C);
  });
  it("duplicateAt insère une copie indépendante", () => {
    const r = duplicateAt([A, B], 0);
    expect(r.length).toBe(3);
    expect(r[1]).not.toBe(A); expect(r[1].h).toBe("A");
  });
  it("updateAt ne modifie que la cible (immutable)", () => {
    const r = updateAt([A, B], 1, { h: "B2" });
    expect(r[1].h).toBe("B2"); expect(B.h).toBe("B");
  });
});

describe("keyFor (clé stable par référence)", () => {
  it("stable pour un même objet, distincte entre objets", () => {
    const a = { h: "A" }, b = { h: "B" };
    const ka = keyFor(a);
    expect(keyFor(a)).toBe(ka);
    expect(keyFor(b)).not.toBe(ka);
  });
  it("la clé suit l'objet après réorganisation", () => {
    const a = { h: "A" }, b = { h: "B" };
    const arr = [a, b];
    const ka = keyFor(arr[0]);
    const t = arr[0]; arr[0] = arr[1]; arr[1] = t;
    expect(keyFor(arr[1])).toBe(ka);
  });
});
