import LegalLayout from "./LegalLayout";
import html from "./content/politique-cookies.html?raw";

export default function PolitiqueCookies() {
  return (
    <LegalLayout>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalLayout>
  );
}
