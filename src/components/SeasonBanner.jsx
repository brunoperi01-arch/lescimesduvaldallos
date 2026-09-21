import { Link } from "react-router-dom";
import { useSeason } from "../context/SeasonContext";
import { otherSeason } from "../lib/season";

// Bandeau inter-saison : renvoie vers la page permanente de l'autre saison
// (navigation claire + indexable). Masqué sur les pages permanentes.
export default function SeasonBanner() {
  const { season, forced } = useSeason();
  if (forced) return null;

  const other = otherSeason(season);
  const to = other === "hiver" ? "/hiver-ski" : "/ete-randonnee";
  const msg = other === "hiver"
    ? "Vous préparez l'hiver ? Découvrez les séjours ski."
    : "Envie de montagne l'été ? Découvrez randonnées et lac d'Allos.";

  return (
    <div className="season-banner"><div className="wrap">
      <span>{other === "hiver" ? "❄" : "☀"} {msg}</span>
      <Link to={to}>Voir la saison {other === "hiver" ? "hiver" : "été"} →</Link>
    </div></div>
  );
}
