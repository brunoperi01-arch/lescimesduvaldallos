// Mentions légales dérivées du CONTENU PUBLIÉ (source unique, pas de HTML statique).
// N'affiche que les champs réellement renseignés (aucun placeholder).
export function legalMentions(content) {
  const L = (content && content.legal) || {};
  const r = (content && content.residence) || {};
  const rows = [
    ["Raison sociale", L.raisonSociale || r.raisonSociale],
    ["Capital social", L.capital],
    ["RCS", L.rcs],
    ["SIREN", L.siren],
    ["SIRET (siège)", L.siret],
    ["N° TVA intracommunautaire", L.tva],
    ["Immatriculation Atout France", L.atoutFrance || r.atoutFrance],
    ["Garantie financière", L.garantFinancier],
    ["Responsabilité civile professionnelle", L.rcp],
    ["Siège social", L.siege || r.adresse],
    ["Hébergeur", L.hebergeur],
    ["Responsables de la publication", L.responsablesPublication || r.responsablesPublication],
  ];
  return rows.filter(([, v]) => v && String(v).trim() !== "");
}

// Médiateur : chaîne libre saisie dans l'admin, ou null tant que non renseigné.
export function mediateur(content) {
  const m = content && content.legal && content.legal.mediateur;
  return m && String(m).trim() ? String(m).trim() : null;
}
