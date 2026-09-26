import { canonicalUrl, FIXED_PUBLIC_PATHS } from "../src/lib/siteSeo.js";
const escapeXml = value => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
export function buildSitemap(content) {
  const paths = new Set(FIXED_PUBLIC_PATHS);
  for (const page of content.pages || []) {
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug) && page.slug !== "admin") paths.add(`/${page.slug}`);
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + [...paths].map(path => `  <url><loc>${escapeXml(canonicalUrl(path))}</loc></url>`).join("\n")
    + "\n</urlset>\n";
}
