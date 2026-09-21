import { useSeason } from "../context/SeasonContext";
import { bookResalys } from "../lib/bookResalys";

export default function LodgeCards() {
  const { content } = useSeason();
  return (
    <section className="sec wrap" id="hebergements">
      <div className="sh">
        <span className="eyebrow">Nos appartements</span>
        <h2>Un logement pour chaque tribu.</h2>
        <p>Du couple en escapade à la famille de huit. Tous avec cuisine équipée, balcon et accès à l'espace bien-être.</p>
      </div>
      <div className="apts">
        {content.hebergements.map((c, i) => (
          <div className="apt" key={i}>
            <div className="apt-img">
              <span className="apt-tag">{c.tag}</span>
              {c.img && <img src={c.img} alt={c.alt || c.h} onError={(e)=>{e.currentTarget.style.display="none";}} />}
            </div>
            <div className="apt-b">
              <div className="apt-meta">{c.meta}</div>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
              <div className="apt-foot">
                <span className="cap">Balcon</span>
                <button onClick={() => bookResalys({})}>Voir dispos →</button>
              </div>
            </div>
          </div>
        ))}
        <div className="apt apt-help">
          <div className="apt-b">
            <h3>Besoin d'aide ?</h3>
            <p>Notre équipe vous conseille le logement idéal selon votre groupe.</p>
            <div className="apt-foot" style={{ border: "none", justifyContent: "center" }}>
              <button onClick={() => (window.location.href = `tel:${content.residence.telephone.replace(/\s/g,"")}`)}>
                {content.residence.telephone}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
