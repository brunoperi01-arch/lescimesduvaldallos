import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { canonicalUrl, homeSeo, SITE_URL } from "../../src/lib/siteSeo.js";
import { buildSitemap } from "../sitemap.js";
import { createSitemapHandler } from "../../api/sitemap.js";
import { buildJsonLd } from "../../src/lib/jsonld.js";
const content = JSON.parse(readFileSync(new URL("../../public/content.json", import.meta.url), "utf8"));
function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } }; }
describe("SEO public", () => {
  it("canonical sans query, fragment ou slash final", () => {
    expect(canonicalUrl("/nos-hebergements/?utm_source=x#prix")).toBe(SITE_URL + "/nos-hebergements");
    expect(canonicalUrl("/")).toBe(SITE_URL + "/");
    expect(() => canonicalUrl("//evil.example")).toThrow();
  });
  it("titres distincts accueil, été et hiver", () => {
    expect(new Set(["/", "/hiver-ski", "/ete-randonnee"].map(p => homeSeo(p).title)).size).toBe(3);
  });
  it("sitemap reflète les pages publiées et déduplique les routes fixes", () => {
    const xml = buildSitemap({ pages: [{ slug: "nouvelle-page" }, { slug: "nos-hebergements" }, { slug: "admin" }, { slug: "../invalide" }] });
    expect(xml).toContain(SITE_URL + "/nouvelle-page");
    expect(xml.match(/<loc>[^<]*\/nos-hebergements<\/loc>/g)).toHaveLength(1);
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("invalide");
    expect(xml).not.toContain("lastmod");
  });
  it("sitemap GET depuis le publié, HEAD sans corps", async () => {
    const handler = createSitemapHandler({ db: { getPublished: async () => ({ content }) } });
    const res = response(); await handler({ method: "GET" }, res);
    expect(res.statusCode).toBe(200); expect(res.body).toContain("<urlset");
    expect(res.headers["Content-Type"]).toContain("application/xml");
    const head = response(); await handler({ method: "HEAD" }, head);
    expect(head.statusCode).toBe(200); expect(head.body).toBeUndefined();
  });
  it("aucun faux sitemap en cas de contenu absent, invalide ou panne", async () => {
    for (const getPublished of [async () => null, async () => ({ content: {} }), async () => { throw new Error("secret"); }]) {
      const res = response(); await createSitemapHandler({ db: { getPublished } })({ method: "GET" }, res);
      expect(res.statusCode).toBe(503); expect(res.headers["Cache-Control"]).toBe("no-store"); expect(res.body).toBeUndefined();
    }
  });
  it("refuse les mutations du sitemap", async () => {
    const res = response(); await createSitemapHandler({ db: {} })({ method: "POST" }, res);
    expect(res.statusCode).toBe(405);
  });
  it("JSON-LD ne transforme jamais le siège social en adresse touristique", () => {
    const ld = buildJsonLd({ residence: { nom: "Les Cimes" }, legal: { siege: "Siège distant" } }, "ete");
    expect(ld.address).toBeUndefined(); expect(ld.url).toBe(SITE_URL + "/");
  });
});
