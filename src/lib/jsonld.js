// JSON-LD LodgingBusiness — données réelles uniquement.
// Offer généré UNIQUEMENT si un prix numérique valide est publié.
export function buildJsonLd(content, season) {
  const r = (content && content.residence) || {};
  const L = (content && content.legal) || {};
  const ld = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: r.nom,
    url: "https://www.lescimesduvaldallos.com/",
  };
  if (r.telephone) ld.telephone = r.telephone;
  const street = L.siege || r.adresse;
  if (street) ld.address = { "@type": "PostalAddress", streetAddress: street, addressCountry: "FR" };

  const p = content && content.pricing && content.pricing[season];
  const num = p && p.afficher && p.aPartirDe != null ? Number(String(p.aPartirDe).replace(",", ".")) : NaN;
  if (Number.isFinite(num) && num > 0) {
    ld.makesOffer = { "@type": "Offer", price: num, priceCurrency: p.devise === "€" || !p.devise ? "EUR" : p.devise };
  }
  // Jamais d'aggregateRating/review sans avis réels vérifiés.
  return ld;
}
