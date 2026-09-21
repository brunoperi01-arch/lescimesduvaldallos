// Deep-link Resalys — recette complète confirmée sur la config CDVA.
//  - display=search_results            → va directement à la page Disponibilités
//  - actions=updateCriterias;getProposals → force le recalcul avec nos critères
//    (sans lui, la durée retombe à 4 ; sans display, on reste sur le formulaire)
//  - search_form_start_date en JJ/MM/AAAA, search_form_nb_days en nuits
//  - URL construite à la main pour garder ";" et "/" littéraux
const BASE = "https://cdva.resalys.com/rsl/clickbooking";

function toFR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function nights(a, b) {
  if (!a || !b) return 0;
  const n = (new Date(b) - new Date(a)) / 86400000;
  return n > 0 ? Math.round(n) : 0;
}

export function buildResalysUrl({ dateIn, dateOut, adults = 2 } = {}) {
  const parts = [
    "base_id=cdva",
    "webuser=web_fr",
    "tokens=ignore_token",
    "display=search_results",
    "actions=updateCriterias;getProposals",
    "criterias_object_name=search_form",
    "search_form_etab=1",
    `search_form_nb_adults=${adults}`,
  ];
  if (dateIn) parts.push(`search_form_start_date=${toFR(dateIn)}`);
  const nb = nights(dateIn, dateOut);
  if (nb > 0) parts.push(`search_form_nb_days=${nb}`);

  return `${BASE}?${parts.join("&")}`;
}

export function bookResalys(args = {}) {
  window.open(buildResalysUrl(args), "_blank", "noopener");
}
