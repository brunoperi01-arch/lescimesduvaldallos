// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { getFocusable } from "../focusTrap";

describe("getFocusable", () => {
  it("retourne les éléments focusables, ignore disabled et tabindex=-1", () => {
    const c = document.createElement("div");
    c.innerHTML = `
      <a href="#a">a</a>
      <button>b</button>
      <button disabled>c</button>
      <input />
      <input disabled />
      <div tabindex="-1">skip</div>
      <div tabindex="0">focusable</div>`;
    const f = getFocusable(c);
    const tags = f.map((e) => e.tagName.toLowerCase());
    expect(tags).toEqual(["a", "button", "input", "div"]);
  });
  it("conteneur nul -> tableau vide", () => {
    expect(getFocusable(null)).toEqual([]);
  });
});
