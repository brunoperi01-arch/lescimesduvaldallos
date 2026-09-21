import { useState, useRef } from "react";
import { useFocusTrap } from "../lib/focusTrap";
import { bookingStatus } from "../lib/bookingStatus";
import { Link, NavLink } from "react-router-dom";
import { useSeason } from "../context/SeasonContext";

// En-tête toujours plein (fond blanc) et en flux normal : plus aucun
// chevauchement avec le bandeau saison, sur mobile comme sur desktop.
export default function Nav() {
  const { content, season } = useSeason();
  const bs = bookingStatus(content, season);
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/notre-residence", label: "La résidence" },
    { to: "/nos-hebergements", label: "Appartements" },
    { to: "/informations-pratiques", label: "Informations pratiques" },
  ];
  const menuRef = useRef(null);
  useFocusTrap(open, menuRef, () => setOpen(false));
  const Item = ({ to, label, onClick }) =>
    to.startsWith("/") ? <Link to={to} onClick={onClick}>{label}</Link>
                       : <a href={to} onClick={onClick}>{label}</a>;

  return (
    <>
      <header className="nav solid">
        <Link to="/"><img className="logo" src="/images/logo.png" alt="Les Cimes du Val d'Allos" /></Link>

        <div className="nav-links">
          {links.map((l) => <Item key={l.to} {...l} />)}
          <span className="season-toggle">
            <NavLink to="/hiver-ski" className={({isActive}) => isActive ? "on" : ""}>Hiver</NavLink>
            <span className="sep">·</span>
            <NavLink to="/ete-randonnee" className={({isActive}) => isActive ? "on" : ""}>Été</NavLink>
          </span>
          {bs.ctaEnabled && <a className="nav-cta" href={bs.ctaUrl} target="_blank" rel="noopener">{bs.ctaLabel}</a>}
        </div>

        <button className="burger" aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      {open && (
        <div className="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" ref={menuRef}>
          <button className="close" aria-label="Fermer" onClick={() => setOpen(false)}>×</button>
          <nav>
            {links.map((l) => <Item key={l.to} {...l} onClick={() => setOpen(false)} />)}
            <Link to="/nos-prestations" onClick={() => setOpen(false)}>Nos prestations</Link>
            <Link to="/la-station-val-d-allos" onClick={() => setOpen(false)}>La station</Link>
            <Link to="/hiver-ski" onClick={() => setOpen(false)}>Séjours hiver</Link>
            <Link to="/ete-randonnee" onClick={() => setOpen(false)}>Séjours été</Link>
            {bs.ctaEnabled && <a className="m-cta" href={bs.ctaUrl} target="_blank" rel="noopener">{bs.ctaLabel}</a>}
          </nav>
        </div>
      )}
    </>
  );
}
