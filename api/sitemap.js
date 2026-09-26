import { neonDb } from "../server/db.js";
import { validateContent } from "../server/validation.js";
import { buildSitemap } from "../server/sitemap.js";

export function createSitemapHandler({ db }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.statusCode = 405;
      res.setHeader("Allow", "GET, HEAD");
      return res.end();
    }
    try {
      const row = await db.getPublished();
      if (!row || !validateContent(row.content).success) {
        res.statusCode = 503;
        return res.end();
      }
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.statusCode = 200;
      return res.end(req.method === "HEAD" ? undefined : buildSitemap(row.content));
    } catch {
      res.statusCode = 503;
      return res.end();
    }
  };
}
export default createSitemapHandler({ db: neonDb });
