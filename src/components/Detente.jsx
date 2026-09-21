// Espace bien-être : piscine, sauna, hammam (valable toute saison).
export default function Detente() {
  return (
    <section className="sec wrap" id="detente">
      <div className="split">
        <div className="split-img">
        </div>
        <div className="split-tx">
          <span className="eyebrow">Espace bien-être</span>
          <h2>Après l'effort, l'eau chaude.</h2>
          <p>Piscine intérieure chauffée, sauna et hammam vous attendent au retour des pistes ou des sentiers — en accès gratuit.</p>
          <p>Un espace pensé pour récupérer, inclus dans votre location sans supplément.</p>
          <div className="chips">
            <span className="chip">Piscine chauffée</span>
            <span className="chip">Sauna</span>
            <span className="chip">Hammam</span>
            <span className="chip">Inclus</span>
          </div>
        </div>
      </div>
    </section>
  );
}
