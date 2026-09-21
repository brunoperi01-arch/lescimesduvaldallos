import "./legal.css";

// Enveloppe commune aux pages légales (pas de <main> : il est déjà fourni par RootLayout).
export default function LegalLayout({ children }) {
  return (
    <div className="legal-page">
      <div className="legal-container">{children}</div>
    </div>
  );
}
