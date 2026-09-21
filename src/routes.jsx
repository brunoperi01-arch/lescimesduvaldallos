// Source unique des routes.
import { lazy, Suspense } from "react";
import RootLayout from "./components/RootLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import MentionsLegales from "./pages/legal/MentionsLegales";
import PolitiqueConfidentialite from "./pages/legal/PolitiqueConfidentialite";
import PolitiqueCookies from "./pages/legal/PolitiqueCookies";
import ConditionsLocation from "./pages/legal/ConditionsLocation";
import DynamicPage from "./pages/DynamicPage";
import AppartementsPage from "./pages/AppartementsPage";
const AdminApp = lazy(() => import("./admin/AdminApp"));
const PreviewApp = lazy(() => import("./admin/PreviewApp"));

export const routes = [
  {
    path: "/admin",
    element: <Suspense fallback={<div style={{padding:40,fontFamily:"system-ui"}}>Chargement\u2026</div>}><AdminApp /></Suspense>,
  },
  {
    path: "/admin/preview",
    element: <Suspense fallback={<div style={{padding:40,fontFamily:"system-ui"}}>Chargement\u2026</div>}><PreviewApp /></Suspense>,
  },
  {
    path: "/",
    element: <RootLayout />,           // saison automatique (date + override admin)
    children: [
      { index: true, element: <Home /> },
      { path: "mentions-legales", element: <MentionsLegales /> },
      { path: "politique-confidentialite", element: <PolitiqueConfidentialite /> },
      { path: "politique-cookies", element: <PolitiqueCookies /> },
      { path: "conditions-location", element: <ConditionsLocation /> },
      { path: "nos-hebergements", element: <AppartementsPage /> },
      { path: ":slug", element: <DynamicPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    // Page permanente HIVER — indexable toute l'année (SEO ski).
    path: "/hiver-ski",
    element: <RootLayout forced="hiver" />,
    children: [{ index: true, element: <Home /> }],
  },
  {
    // Page permanente ÉTÉ — indexable toute l'année (SEO randonnée / lac d'Allos).
    path: "/ete-randonnee",
    element: <RootLayout forced="ete" />,
    children: [{ index: true, element: <Home /> }],
  },
];
