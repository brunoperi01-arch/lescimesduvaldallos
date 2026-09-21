// Résolution de la saison affichée.
// Stratégie marketing : hiver mis en avant de septembre à avril, été de mai à août.
// Priorité : choix visiteur > override admin (content.seasonOverride) > date.

export function seasonByDate(date = new Date()) {
  const m = date.getMonth() + 1; // 1-12
  return m >= 5 && m <= 8 ? "ete" : "hiver";
}

export function resolveSeason({ adminOverride = "auto", visitorOverride = null } = {}) {
  if (visitorOverride === "hiver" || visitorOverride === "ete") return visitorOverride;
  if (adminOverride === "hiver" || adminOverride === "ete") return adminOverride;
  return seasonByDate();
}

export const otherSeason = (s) => (s === "ete" ? "hiver" : "ete");
export const seasonLabel = (s) => (s === "ete" ? "Été" : "Hiver");
