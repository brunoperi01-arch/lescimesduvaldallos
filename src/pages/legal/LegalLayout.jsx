import { useLocation } from "react-router-dom";
import Seo from "../../components/Seo";
import { LEGAL_SEO, SITE_NAME } from "../../lib/siteSeo";
import "./legal.css";

// Enveloppe commune aux pages légales (pas de <main> : il est déjà fourni par RootLayout).
export default function LegalLayout({ children }) {
  const { pathname } = useLocation();
  const [title, description] = LEGAL_SEO[pathname] || ["Informations légales", "Informations légales de la résidence."];
  return (
    <div className="legal-page">
      <Seo title={`${title} | ${SITE_NAME}`} description={description} path={pathname} />
      <div className="legal-container">{children}</div>
    </div>
  );
}
