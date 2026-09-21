import { useSeason } from "../context/SeasonContext";

export default function Pillars() {
  const { data } = useSeason();
  return (
    <section className="pillars"><div className="pillars-grid">
      {data.pillars.map((p, i) => (
        <div className="pillar" key={i}>
          <div className="k">{p.k}</div>
          <h3>{p.h}</h3>
          <p>{p.p}</p>
        </div>
      ))}
    </div></section>
  );
}
