import { Link } from "react-router-dom";
import { useSeason } from "../context/SeasonContext";
import Price from "./Price";
import { bookingStatus } from "../lib/bookingStatus";

export default function Hero() {
  const { data, content, season } = useSeason();
  const bs = bookingStatus(content, season);
  const { hero } = data;
  const hasImg = Boolean(hero.image);

  return (
    <section className="hero">
      {hasImg
        ? <div className="hero-bg" style={{ backgroundImage: `url(${hero.image})` }} />
        : <div className="hero-bg ph" />}
      <div className="hero-ov" />
      <div className="hero-inner"><div className="wrap">
        <div className="altitude"><span className="line" /><span>{hero.eyebrow}</span></div>
        <h1>{hero.titre}</h1>
        <p>{hero.sousTitre}</p>
        <Price />
        <div className="hero-cta">
          {bs.ctaEnabled && <a className="btn-accent" href={bs.ctaUrl} target="_blank" rel="noopener">{bs.ctaLabel}</a>}
          <Link className="btn-ghost" to="/nos-hebergements">Découvrir les appartements</Link>
        </div>
      </div></div>
    </section>
  );
}
