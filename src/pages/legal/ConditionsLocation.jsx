import LegalLayout from "./LegalLayout";
import html from "./content/conditions-location.html?raw";

export default function ConditionsLocation() {
  return (
    <LegalLayout>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalLayout>
  );
}
