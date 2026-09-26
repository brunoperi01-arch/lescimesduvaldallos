// Domaine public de référence : aucune URL de Preview dans les canonicals.
export const SITE_URL = "https://www.lescimesduvaldallos.com";
export const SITE_NAME = "Les Cimes du Val d'Allos";
export const HOME_DESCRIPTION = "Séjournez aux Cimes du Val d’Allos à La Foux d’Allos. Découvrez les appartements, les services de la résidence et les disponibilités pour vos vacances.";
export function canonicalUrl(path = "/") {
  const clean = String(path).split(/[?#]/)[0];
  if (!clean.startsWith("/") || clean.startsWith("//") || clean.includes("\\")) throw new Error("Chemin SEO invalide");
  return SITE_URL + (clean.replace(/\/+$/, "") || "/");
}
export const LEGAL_SEO = {
  "/mentions-legales": ["Mentions légales", "Éditeur, coordonnées et informations légales de la résidence Les Cimes du Val d’Allos."],
  "/politique-confidentialite": ["Politique de confidentialité", "Informations sur le traitement de vos données personnelles et vos droits auprès des Cimes du Val d’Allos."],
  "/politique-cookies": ["Politique de gestion des cookies", "Informations sur les cookies utilisés sur le site des Cimes du Val d’Allos."],
  "/conditions-location": ["Conditions de location", "Consultez les conditions de location pour préparer votre séjour aux Cimes du Val d’Allos."],
};
export const FIXED_PUBLIC_PATHS = ["/", "/nos-hebergements", "/hiver-ski", "/ete-randonnee", ...Object.keys(LEGAL_SEO)];
export function homeSeo(path) {
  if (path === "/hiver-ski") return { title: "Séjour au ski à La Foux d’Allos | Les Cimes", description: "Préparez votre séjour d’hiver à La Foux d’Allos : découvrez les appartements des Cimes du Val d’Allos, les services et les disponibilités." };
  if (path === "/ete-randonnee") return { title: "Vacances d’été à La Foux d’Allos | Les Cimes", description: "Préparez vos vacances d’été à La Foux d’Allos : découvrez la résidence Les Cimes, les appartements et les activités en montagne." };
  return { title: "Les Cimes du Val d’Allos | Résidence à La Foux d’Allos", description: HOME_DESCRIPTION };
}
