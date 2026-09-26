import LodgeCards from "../components/LodgeCards";
import Seo from "../components/Seo";

export default function AppartementsPage() {
  return (
    <div>
      <Seo title="Appartements à La Foux d’Allos | Les Cimes" description="Découvrez les appartements des Cimes du Val d’Allos. Comparez les hébergements et consultez les disponibilités pour votre séjour à La Foux d’Allos." path="/nos-hebergements" />
      <header style={{ maxWidth: 1100, margin: "0 auto", padding: "160px 24px 24px" }}>
        <h1>Nos appartements à La Foux d’Allos</h1>
        <p>Découvrez les hébergements de la résidence et choisissez l’appartement adapté à votre séjour.</p>
      </header>
      <LodgeCards />
    </div>
  );
}
