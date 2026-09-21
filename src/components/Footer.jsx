import { Link } from "react-router-dom";
import { useSeason } from "../context/SeasonContext";
import { bookingStatus } from "../lib/bookingStatus";

export default function Footer() {
  const { content, season } = useSeason();
  const bs = bookingStatus(content, season);
  const r = content.residence;
  const L = content.legal || {};
  return (
    <footer className="footer">
      {/* Zone de réassurance */}
      <div className="reassure"><div className="wrap">
        <span>★ Résidence 3 étoiles</span>
        <span>♥ Station labellisée Famille Plus</span>
        <span>≋ Piscine · sauna · hammam</span>
        <span>✓ Gérée par les propriétaires</span>
        <span>🔒 Atout France {L.atoutFrance || r.atoutFrance}</span>
      </div></div>

      <div className="wrap">
        <div className="footer-top">
          <div>
            <img className="logo-w" src="/images/logo-blanc.png" alt="Les Cimes du Val d'Allos" />
            <p className="footer-intro">{r.adresse}<br /><a href={`tel:${(r.telephone||"").replace(/\\s/g,"")}`}>{r.telephone}</a> · <a href={`mailto:${r.email}`}>{r.email}</a></p>
          </div>
          <div className="footer-col">
            <h4>Réservation</h4>
            {bs.ctaEnabled && <a href={bs.ctaUrl} target="_blank" rel="noopener">{bs.ctaLabel}</a>}
            <a href={r.resalysClient} target="_blank" rel="noopener">Espace client</a>
            <a href={r.etatDesLieux || "#"} target="_blank" rel="noopener">État des lieux</a>
            <a href={r.coffrets} target="_blank" rel="noopener">Coffrets cadeaux</a>
          </div>
          <div className="footer-col">
            <h4>Découvrir</h4>
            <Link to="/notre-residence">La résidence</Link>
            <Link to="/nos-hebergements">Appartements</Link>
            <Link to="/nos-prestations">Nos prestations</Link>
            <Link to="/la-station-val-d-allos">La station</Link>
            <Link to="/informations-pratiques">Informations pratiques</Link>
          </div>
          <div className="footer-col">
            <h4>Infos</h4>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/nos-partenaires">Nos partenaires</Link>
            <Link to="/recrutement">Recrutement</Link>
            <Link to="/politique-cookies">Cookies</Link>
          </div>
        </div>

        <div className="footer-legal">
          {L.raisonSociale || r.raisonSociale} · Atout France {L.atoutFrance || r.atoutFrance}
          {L.garantFinancier ? ` · Garant financier : ${L.garantFinancier}` : ""}
          {L.rcp ? ` · RCP : ${L.rcp}` : ""}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {r.raisonSociale}</span>
          <span>Site géré par ses propriétaires</span>
        </div>
      </div>
    </footer>
  );
}
