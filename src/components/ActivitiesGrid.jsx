import { useSeason } from "../context/SeasonContext";

export default function ActivitiesGrid() {
  const { data } = useSeason();
  return (
    <section className="sec wrap" id="activites">
      <div className="sec-head">
        <span className="eyebrow">À découvrir</span>
        <h2>{data.activitesTitre}</h2>
        <p>{data.activitesIntro}</p>
      </div>
      <div className="acts">
        {data.activites.map((a, i) => (
          <div className="act" key={i}>
            <div className="act-bg" style={a.img ? { backgroundImage: `url(${a.img})` } : undefined} />
            {!a.img && <span className="ph-note">◧ Photo à intégrer</span>}
            <div className="act-ov" />
            <div className="act-body"><h3>{a.h}</h3><p>{a.p}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
