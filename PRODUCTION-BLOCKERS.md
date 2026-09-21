# Blocages de production — données humaines manquantes

> La publication publique reste **bloquée** tant que ces informations ne sont pas
> renseignées dans le CMS. Aucune n'est inventée. La Preview Vercel peut être
> déployée en `noindex` malgré ces blocages.

## 🔴 Bloquant (empêche la publication)
- **Médiateur de la consommation** — nom, adresse, site, modalités de saisine.
  Emplacement CMS : écran « Mentions légales » → champ `legal.mediateur`.
  Tant qu'il est vide : `checkPublishable` et la fonction SQL de publication refusent la mise en ligne (retour `draft_only` au seed).

## 🟠 À confirmer avant publication (ne pas inventer)
- **Capacités exactes** des studios / T2 (les types non confirmés restent masqués) — `hebergements[]`.
- **Nombre d'appartements** (92 vs 105 non tranché) — ne rien afficher.
- **Prix hiver** — `pricing.hiver` : rester en `availability_only` (pas de prix inventé).
- **Dates d'ouverture/fermeture** — ne pas afficher tant que non confirmées.
- **Avis clients** — aucun avis fictif ; bloc masqué tant qu'aucune source réelle.
- **Photos réelles** — été, intérieurs d'appartements, piscine/bien-être (fallback graphique en attendant, jamais « Photo à intégrer » en public).

## 🟢 Déjà présent (vérifié)
- Identité exploitant, adresse/siège, SIREN/SIRET, TVA, Atout France, RCP/garant, directeur de publication, hébergeur — dans `legal` (rendu par la page Mentions légales depuis le contenu publié).
- Prix d'appel été « à partir de 312 € / semaine (selon dates, disponibilités et type d'appartement) ».
