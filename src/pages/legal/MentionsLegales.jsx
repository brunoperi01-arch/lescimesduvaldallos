import LegalLayout from "./LegalLayout";
import { useContent } from "../../context/ContentContext";
import { legalMentions, mediateur } from "../../lib/legal";

export default function MentionsLegales() {
  const content = useContent();
  const rows = legalMentions(content);
  const med = mediateur(content);
  const r = content.residence || {};

  return (
    <LegalLayout>
      <article>
        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <ul>
          {rows.map(([label, value]) => (
            <li key={label}><strong>{label} :</strong> {value}</li>
          ))}
          {(r.telephone || r.email) && (
            <li><strong>Contact :</strong> {r.telephone}{r.telephone && r.email ? " — " : ""}{r.email}</li>
          )}
        </ul>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments du site (textes, images, graphismes, logo, icônes) est protégé.
          Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable, est interdite.
        </p>

        <h2>Réservations</h2>
        <p>
          Les réservations et paiements sont opérés via la centrale Resalys, accessible depuis ce site,
          complétés par les <a href="/conditions-location">conditions de location</a>.
        </p>

        <h2>Données personnelles &amp; cookies</h2>
        <p>
          Voir la <a href="/politique-confidentialite">politique de confidentialité</a> et la
          {" "}<a href="/politique-cookies">politique de gestion des cookies</a>.
        </p>

        {med && (
          <>
            <h2>Médiation de la consommation</h2>
            <p>{med}</p>
          </>
        )}

        <h2>Droit applicable</h2>
        <p>Le présent site est soumis au droit français.</p>
      </article>
    </LegalLayout>
  );
}
