import { useSeason } from "../context/SeasonContext";
import { bookingStatus } from "../lib/bookingStatus";

export default function CTA() {
  const { content, season } = useSeason();
  const bs = bookingStatus(content, season);
  return (
    <section className="cta"><div className="wrap">
      <h2>Votre séjour commence ici.</h2>
      <p>Vérifiez les disponibilités et réservez en quelques clics.</p>
      {bs.ctaEnabled && <a className="btn-accent" href={bs.ctaUrl} target="_blank" rel="noopener">{bs.ctaLabel}</a>}
    </div></section>
  );
}
