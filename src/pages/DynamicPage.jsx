import { useParams } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import NotFound from "./NotFound";
import Seo from "../components/Seo";

// Rend une page personnalisée définie dans content.json > pages[].
export default function DynamicPage() {
  const { slug } = useParams();
  const content = useContent();
  const page = (content.pages || []).find((p) => p.slug === slug);
  if (!page) return <NotFound />;

  return (
    <div className="page">
      <Seo title={`${page.title} — ${content.residence.nom}`} description={page.metaDescription} path={`/${slug}`} />
      {page.sections.map((s, i) => <Section key={i} s={s} />)}
    </div>
  );
}

function Section({ s }) {
  if (s.type === "hero") {
    return (
      <section className="page-hero">
        {s.image
          ? <div className="page-hero-bg" style={{ backgroundImage: `url(${s.image})` }} />
          : <div className="page-hero-bg ph" />}
        <div className="page-hero-ov" />
        <div className="wrap page-hero-txt">
          <h1>{s.titre}</h1>
          {s.sousTitre && <p>{s.sousTitre}</p>}
        </div>
      </section>
    );
  }
  if (s.type === "image") {
    return (
      <section className="wrap page-block">
        {s.image && <img className="page-img" src={s.image} alt={s.alt || s.legende || ""} />}
        {s.legende && <p className="page-legende">{s.legende}</p>}
      </section>
    );
  }
  if (s.type === "cta") {
    return (
      <section className="page-cta"><div className="wrap">
        {s.titre && <h2>{s.titre}</h2>}
        {s.lien && <a className="btn-accent" href={s.lien}>{s.texte || "En savoir plus"}</a>}
      </div></section>
    );
  }
  // type "text" par défaut
  return (
    <section className="wrap page-block">
      {s.titre && <h2 className="page-h2">{s.titre}</h2>}
      {String(s.contenu || "").split("\n").filter(Boolean).map((par, i) => (
        <p className="page-p" key={i}>{par}</p>
      ))}
    </section>
  );
}
