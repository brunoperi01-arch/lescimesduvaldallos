# Checklist métier — à valider avant mise en production

> Ces points nécessitent une validation humaine (exploitant / juriste).
> Rien de tout cela ne doit être publié comme un fait tant que ce n'est pas confirmé.
> Aucune donnée n'a été inventée : les inconnues sont marquées comme telles.

## Domaine skiable (chiffres)
- [ ] Espace Lumière : **180 km de pistes, 91 pistes, 37 remontées, 1 500–2 575 m** (skis aux pieds La Foux + Pra Loup).
      Source : praloup.com / valdallos.com — **à revérifier chaque saison**.
- [ ] Le chiffre **230 km** ne peut être utilisé qu'avec la mention « forfait Espace Lumière, Le Seignus inclus (navette) ».
- [ ] Formulation retenue : « l'un des plus grands domaines des Alpes du Sud » (et non « français »).

## Tarifs
- [ ] Prix d'appel été « à partir de 312 € / semaine » : confirmer + garder la mention « selon dates, disponibilités et type d'appartement ».
- [ ] Prix d'appel hiver : **non publié** tant que non confirmé (affiche « Tarifs hiver bientôt disponibles »).

## Dates & réservation
- [ ] Dates d'ouverture 2026-2027 (prévisionnel : 12 déc. 2026 → 4 avr. 2027, week-end anticipé 5-6 déc.) — à confirmer, sous réserve d'enneigement.
- [ ] Paiement en plusieurs fois : « sur demande » uniquement (aucune solution automatique annoncée).
- [ ] Champ « Enfants » dans la réservation : non activé tant que les paramètres Resalys ne sont pas confirmés.

## Informations pratiques (déjà intégrées, à confirmer)
- [ ] Animaux 35 €/animal/sem · Parking couvert 54 pl. (40 € hiver / 25 € été) · Kit bébé gratuit sur réservation.
- [ ] Acompte 30 % + solde à J-30 · Barème d'annulation · Assurance SafeBooking 4,5 %.
- [ ] Linge / ménage : « sur réservation, tarifs communiqués lors de la réservation » (anciens 45/55 € NON publiés).

## Juridique (validation humaine obligatoire)
- [ ] Mentions légales : capital, RCS, SIRET, TVA **renseignés** ; date de mise à jour à compléter.
- [ ] **Médiateur de la consommation** : à renseigner dès l'adhésion — NE PAS inventer.
- [ ] Montant de la **caution** : à confirmer.
- [ ] Conditions de location/annulation à rapprocher des CGV réellement appliquées par Resalys + relecture juriste.
- [ ] Politique de confidentialité/cookies : cohérente avec les traitements réels (aucun traceur marketing actif → bannière retirée).

## Contenu & médias
- [ ] Label « **Famille Plus** » : formulé « station labellisée » (le label concerne la station, pas la résidence).
- [ ] **Nombre d'appartements** : 105 (site actuel) vs 92 (note interne) — à trancher (aucun chiffre affiché en attendant).
- [ ] Photos manquantes : **été** (résidence sans neige, rando, lac), **intérieurs d'appartements**, **piscine/bien-être**.
- [ ] Avis clients : les avis d'exemple ont été **retirés**. À reconnecter à de vrais avis (Google/Booking) avec autorisation.
- [ ] Image Open Graph : utilise `hero-hiver.jpg` provisoirement — prévoir un visuel OG dédié (1200×630).

## Technique (décisions à prendre — hors bloc 1)
- [ ] **SEO / SSR-SSG** : la SPA sert le même HTML partout. Migration React Router framework à décider (fort impact SEO).
- [ ] **CMS Neon** (brouillon/publication/versions/Auth) : à décider selon l'usage réel (le workflow git actuel reste gratuit et suffisant en mono-utilisateur).
- [ ] Tests + CI (lint/typecheck/tests/build) : à ajouter si passage en production sérieuse.

## CMS Neon (livré — à exécuter côté exploitant)
- [ ] Lancer `Neon/migrations/0001_cimes_cms.sql` (idempotent).
- [ ] Créer le 1er admin + `insert into cimes_admins`.
- [ ] Renseigner `VITE_Neon_URL` / `VITE_Neon_ANON_KEY` sur Vercel + redeploy.
- [ ] **Tests RLS non exécutés ici** (pas d'accès Neon au build) : à vérifier après migration.
- [ ] SEO SSR/SSG : non fait (helmet client uniquement) — décision séparée.

## Durcissement CMS (0002) — statuts
- [confirmé] Concurrence : `draft_revision` monotone + RPC transactionnelles ; publication du **brouillon stocké** (jamais du JSON navigateur).
- [confirmé] Deux admins ne peuvent plus s'écraser (conflits `draft_conflict` / `published_conflict`).
- [confirmé] Restauration = nouvelle publication atomique + réalignement du brouillon.
- [intégré] Schéma Zod strict (enum saison, couleurs, e-mail, unions de sections, alt obligatoire).
- [intégré] Garde-fous de publication : blocage `[À COMPLÉTER]`, `TODO`, `230 km`, « de France », faux avis, liens `#`, images d'hébergement sans alt.
- [intégré] Médias : upload WebP (≤2000 px, q0.82), table `cimes_media`, alt obligatoire côté champ.
- [intégré] `/admin` + `/admin/preview` en `noindex` ; `robots.txt` interdit `/admin`.
- [intégré] Cookies/confidentialité : aucun traceur marketing, pixel Meta retiré, ODR retiré, plus de `[À COMPLÉTER]` public.
- [à confirmer] Chiffres domaine (180/91/37) à revalider chaque saison ; caution, acompte, annulation, SafeBooking, parking, animaux.
- [bloquant] Médiateur de la consommation : à renseigner avant mise en ligne (retiré du public, non inventé).
- [bloquant] Nombre d'appartements 105 vs 92 : à trancher.
- [non exécuté] Tests RLS (`Neon/TEST-RLS.sql`) et Playwright : à lancer côté Neon/navigateur réels.

## V7.1 — statuts
- [intégré] Contradictions commerciales retirées (TopBar ne prétend plus « réservations ouvertes ») ; statut dérivé d'une source unique (`bookingStatus`).
- [intégré] JSON-LD `Offer` uniquement si prix numérique publié (test) ; aucun avis/note inventé.
- [intégré] Mode E2E explicite (fixture validée) ; CSP renforcée (`object-src 'none'`, `frame-ancestors`, `base-uri`, `form-action`).
- [créé, non exécuté] `0004_v71_hardening.sql` : seed idempotent (`draft_exists`), validation SQL renforcée (résidence/email/URL/slugs/liens/alt) — à exécuter dans Neon.
- [créé, non exécuté] `TEST-RLS.sql` renforcé (SQLSTATE/message, échec si fonction absente) — à exécuter dans Neon.
- [bloquant] Médiateur, capacités T2/studios, nombre d'appartements, prix hiver, dates d'ouverture, vraies photos, vrais avis.
- [dette] CSP conserve `'unsafe-inline'` (Vite statique, pas de nonce) ; SEO reste rendu client (helmet), non équivalent SSG/SSR.

## V7.1 — suite (corrections poursuivies)
- [intégré] Mentions légales alimentées par le contenu publié (`legal.js` + `MentionsLegales.jsx`) ; médiateur affiché dès qu'il est renseigné ; plus de HTML statique ni `dangerouslySetInnerHTML` ; `<main>` imbriqué corrigé. Test dédié.
- [intégré] Formulaires CMS durcis : champs contrôlés, clés React stables par référence (WeakMap, sans polluer le contenu), primitives de liste immuables (`listOps.js`). Tests : déplacement, suppression du milieu, duplication, stabilité de clé.
- [intégré] Upload média : rollback honnête (`finalizeMedia`) — insertion KO+nettoyage KO signale un ORPHELIN, ne prétend jamais avoir nettoyé sans preuve. 4 tests.
- [intégré] Piège de focus (`focusTrap.js` : `useFocusTrap`) sur le menu mobile et la modale historique — focus initial, Tab bouclé, Échap, restitution du focus, blocage du scroll. Test jsdom `getFocusable`.
- [partiel] Reste : conversion complète d'AdminApp en état immuable, médiathèque complète UI, SSG/SSR.
