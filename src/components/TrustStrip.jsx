export default function TrustStrip() {
  const items = [
    { ic: "★", txt: <b>Résidence 3 étoiles</b> },
    { ic: "♥", txt: "Station labellisée Famille Plus" },
    { ic: "⛷", txt: "Au pied des pistes" },
    { ic: "≋", txt: "Piscine · sauna · hammam" },
    { ic: "✔", txt: "Immatriculation Atout France" },
  ];
  return (
    <div className="trust"><div className="wrap">
      {items.map((it, i) => (
        <span key={i}><span className="i" aria-hidden="true">{it.ic}</span>{it.txt}</span>
      ))}
    </div></div>
  );
}
