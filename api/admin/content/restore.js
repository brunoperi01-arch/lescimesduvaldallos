import { createRestoreHandler } from "../../../server/contentService.js";
import { neonContentRepository } from "../../../server/contentRepository.js";
import { getConfig } from "../../../server/config.js";
export default async function handler(req, res) {
  let config; try { config = getConfig(); } catch { res.statusCode = 500; res.setHeader("Content-Type","application/json"); return res.end(JSON.stringify({ error: "config" })); }
  return createRestoreHandler({ repo: neonContentRepository(), config })(req, res);
}
