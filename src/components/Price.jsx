import { useSeason } from "../context/SeasonContext";
import { priceDisplay } from "../lib/pricing";

export default function Price({ className = "hero-price" }) {
  const { content, season } = useSeason();
  const d = priceDisplay(content.pricing, season);
  if (!d) return null;
  return (
    <p className={className}>
      <strong>{d.text}</strong>{d.mention ? <span className="hero-price-mention"> {d.mention}</span> : null}
    </p>
  );
}
