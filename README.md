# Les Cimes du Val d'Allos — site React/Vite

Site vitrine + conversion pour la résidence, avec **bascule de saison** (hiver/été),
réservation directe Resalys, sécurité et pages légales.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de production dans dist/
```

## Ce qui est en place

- **Bascule de saison** (`src/lib/season.js`, `src/context/SeasonContext.jsx`) :
  priorité **choix visiteur > override admin > date auto** (été 1ᵉʳ mai → 15 nov.).
  L'accent couleur, le hero, les piliers et les activités changent selon la saison.
- **Override admin** : champ `seasonOverride` dans `src/content/content.json`
  (`"auto"` | `"hiver"` | `"ete"`) — pour forcer une saison (ex. ouverture des résas d'hiver en été).
- **Pages permanentes SEO** : `/hiver-ski` et `/ete-randonnee`, indexables toute l'année,
  réservables toute l'année.
- **Réservation ne bloque jamais** : la barre interroge Resalys sur les dates choisies,
  quelle que soit la saison affichée. Un visiteur d'août peut réserver février.
- **Responsive** : menu hamburger mobile, bouton « Je réserve » collant en bas d'écran,
  points de rupture 1024 / 900 px.
- **Contenu centralisé** : tout le texte éditorial est dans `src/content/content.json`.
- **Pages légales** : contenu dans `src/pages/legal/content/*.html` (source unique).
- **Sécurité** : `vercel.json` (en-têtes), `middleware.js` (Basic Auth admin), `robots.txt`, `sitemap.xml`.
- **RGPD** : `CookieConsent` charge le Pixel Meta uniquement après consentement.

## À COMPLÉTER avant mise en ligne

1. **Photos** (dans `public/images/`) :
   - `hero-ete.jpg` (hero été), photos d'activités été, **photos d'intérieur d'appartements**
     (`apt-t2.jpg`, `apt-t3-6.jpg`, `apt-duplex.jpg`, `apt-t3-8.jpg`), **photo piscine**, `og-cimes.jpg` (1200×630).
   - Les photos d'hiver réelles sont déjà incluses.
2. **Deep-link Resalys** (`src/lib/bookResalys.js`) : confirmer `dateFrom`/`dateTo`
   depuis une vraie URL de résultats Resalys (voir historique).
3. **Contenu légal** : remplir tous les `[À COMPLÉTER]` et **faire relire par un juriste**.
   Réconcilier les conditions de location avec les CGV Resalys.
4. **Variables d'env Vercel** : `ADMIN_USER`, `ADMIN_PASS`.
5. **Pixel Meta** : renseigner `META_PIXEL_ID` dans `CookieConsent.jsx` (si utilisé).

## Structure

```
src/
  main.jsx · routes.jsx · index.css
  content/content.json          ← tout le contenu éditorial + saison
  lib/season.js · lib/bookResalys.js
  context/SeasonContext.jsx
  components/  Nav, Hero, BookingBar, SeasonBanner, TrustStrip, Pillars,
               LodgeCards, ActivitiesGrid, Detente, Services, CTA,
               StickyReserve, Footer, RootLayout, CookieConsent
  pages/  Home, NotFound, legal/*
public/  images/ · robots.txt · sitemap.xml
vercel.json · middleware.js
```

## Étape suivante : SSG (référencement)

`routes.jsx` est déjà au format `vite-react-ssg`. Migration = 3 lignes dans `main.jsx`
(voir commentaire en bas du fichier) + `npm i -D vite-react-ssg`. Chaque route sera
générée en HTML statique → indexation Google correcte.


## Source de contenu (à jour)
Le contenu du site est dans **`public/content.json`** (chargé au runtime, éditable via `public/admin.html`).
Le SSG (`vite-react-ssg`) **n'est pas** encore en place : le site est une SPA. Voir CHECKLIST-METIER.md pour le SEO/SSR.
