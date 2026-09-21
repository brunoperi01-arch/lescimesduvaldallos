import { useSeason } from "../context/SeasonContext";

// Bande "domaine" : stats (hiver) OU cartes d'activités (été).
export default function Domaine() {
  const { data } = useSeason();
  const hasStats = Array.isArray(data.stats) && data.stats.length;

  if (hasStats) {
    return (
      <section className="domain" id="domaine">
        {data.domaineImage
          ? <img className="domain-img" src={data.domaineImage} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} />
          : null}
        <div className="domain-ov" />
        <div className="wrap">
          <span className="eyebrow">Espace Lumière</span>
          <h2>{data.domaineTitre}</h2>
          <p className="lead">{data.domaineIntro}</p>
          <div className="stats">
            {data.stats.map((s, i) => (
              <div className="stat" key={i}><div className="n">{s.n}</div><div className="lb">{s.lb}</div></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // été : cartes d'activités
  return (
    <section className="sec wrap" id="domaine">
      <div className="sh"><span className="eyebrow">À découvrir</span><h2>{data.domaineTitre}</h2>
        <p>{data.domaineIntro}</p></div>
      <div className="acts">
        {(data.activites || []).map((a, i) => (
          <div className="act" key={i}>
            <div className="act-bg" style={a.img ? { backgroundImage:`url(${a.img})` } : undefined} />
            <div className="act-ov" />
            <div className="act-body"><h3>{a.h}</h3><p>{a.p}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
