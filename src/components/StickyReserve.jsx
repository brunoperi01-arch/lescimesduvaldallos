import { useSeason } from "../context/SeasonContext";
import { bookingStatus } from "../lib/bookingStatus";

// Barre "Je réserve" collée en bas d'écran sur mobile.
export default function StickyReserve() {
  const { content, season } = useSeason();
  const bs = bookingStatus(content, season);
  if (!bs.ctaEnabled) return null;
  return (
    <div className="sticky-reserve">
      <button onClick={() => window.open(bs.ctaUrl, "_blank", "noopener")}>
        Je réserve
      </button>
    </div>
  );
}
