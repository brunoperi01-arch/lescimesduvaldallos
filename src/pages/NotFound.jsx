import Seo from "../components/Seo";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "160px 24px 120px", textAlign: "center" }}>
      <Seo title="Page introuvable | Les Cimes du Val d’Allos" noindex />
      <p style={{ color: "var(--accent)", fontWeight: 700, letterSpacing: ".2em", fontSize: 13 }}>ERREUR 404</p>
      <h1 style={{ fontSize: 36, margin: "12px 0 16px" }}>Page introuvable</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-accent">Retour à l'accueil</Link>
    </div>
  );
}
