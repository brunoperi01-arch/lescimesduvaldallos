import { useSeason } from "../context/SeasonContext";

export default function Services() {
  const { content } = useSeason();
  return (
    <section className="sec alt" id="services"><div className="wrap">
      <div className="sh">
        <span className="eyebrow">Services &amp; équipements</span>
        <h2>Tout est prévu.</h2>
        <p>Du quotidien au petit plus : on s'occupe des détails pour que vous n'ayez qu'à profiter.</p>
      </div>
      <div className="serv">
        {content.services.map((s, i) => (
          <div className="s" key={i}>
            <div className="i">{s.i}</div>
            <h4>{s.h}</h4>
            <p>{s.p}</p>
          </div>
        ))}
      </div>
    </div></section>
  );
}
