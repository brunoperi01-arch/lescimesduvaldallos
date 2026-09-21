import { neonDb } from "../../server/db.js";
import { validateContent } from "../../server/validation.js";

export function createPublishedHandler({ db }) {
  return async function handler(req, res) {
    res.setHeader("Content-Type", "application/json"); // toutes les réponses en JSON
    if (req.method !== "GET") { res.statusCode = 405; res.setHeader("Allow", "GET"); res.setHeader("Cache-Control", "no-store"); return res.end(JSON.stringify({ error: "méthode" })); }
    try {
      const row = await db.getPublished();
      if (!row) { res.statusCode = 503; res.setHeader("Cache-Control", "no-store"); return res.end(JSON.stringify({ error: "non_initialise" })); }
      if (!validateContent(row.content).success) { res.statusCode = 500; res.setHeader("Cache-Control", "no-store"); return res.end(JSON.stringify({ error: "contenu_invalide" })); }
      const etag = `W/"v${row.version}"`;
      res.setHeader("ETag", etag);
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      if (req.headers["if-none-match"] === etag) { res.statusCode = 304; return res.end(); }
      res.statusCode = 200; return res.end(JSON.stringify(row.content));
    } catch { res.statusCode = 500; res.setHeader("Cache-Control", "no-store"); return res.end(JSON.stringify({ error: "erreur_serveur" })); }
  };
}
export default async function handler(req, res) { return createPublishedHandler({ db: neonDb })(req, res); }
