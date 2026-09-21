import LegalLayout from "./LegalLayout";
import html from "./content/politique-confidentialite.html?raw";

export default function PolitiqueConfidentialite() {
  return (
    <LegalLayout>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalLayout>
  );
}
