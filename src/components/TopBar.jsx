import { useSeason } from "../context/SeasonContext";

export default function TopBar() {
  const { content, season } = useSeason();
  const r = content.residence;
  const msg = season === "ete"
    ? "☀ Été en montagne — piscine, sauna et hammam inclus"
    : "❄ La Foux d'Allos — au pied des pistes";
  return (
    <div className="topbar"><div className="wrap">
      <span>{msg}</span>
      <span className="tb-r">
        <a href={`tel:${(r.telephone||"").replace(/\s/g,"")}`}>{r.telephone}</a>
        <a href={r.resalysClient} target="_blank" rel="noopener">Espace client</a>
        <a href={r.etatDesLieux || "#"} target="_blank" rel="noopener">État des lieux</a>
      </span>
    </div></div>
  );
}
