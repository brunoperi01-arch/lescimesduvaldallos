// Affichage commercial du prix depuis l'objet `pricing` (jamais recopié en dur).
// - prix visible uniquement si afficher === true et aPartirDe renseigné ;
// - sinon message d'attente (ex. tarifs hiver non confirmés) s'il existe ;
// - aucun prix inventé.
export function priceDisplay(pricing, season) {
  const p = pricing && pricing[season];
  if (!p) return null;
  if (p.afficher && p.aPartirDe) {
    const unite = p.unite ? ` ${p.unite}` : "";
    return { kind: "price", text: `À partir de ${p.aPartirDe} ${p.devise || "€"}${unite}`.trim(), mention: p.mention || "" };
  }
  if (!p.afficher && p.messageAttente) return { kind: "wait", text: p.messageAttente, mention: "" };
  return null;
}
