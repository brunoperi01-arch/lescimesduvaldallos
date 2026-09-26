import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, HOME_DESCRIPTION, canonicalUrl } from "../lib/siteSeo";

export default function Seo({ title, description = HOME_DESCRIPTION, path = "/", image = "/images/hero-hiver.jpg", noindex = false }) {
  const canonical = canonicalUrl(path);
  const img = /^https?:\/\//i.test(image) ? image : canonicalUrl(image);
  // Les adresses de test ne doivent pas concurrencer le domaine public.
  const hidden = noindex || (typeof window !== "undefined" && window.location.origin !== SITE_URL);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description || HOME_DESCRIPTION} />
      <meta name="robots" content={hidden ? "noindex, follow" : "index, follow"} />
      {!noindex && <link rel="canonical" href={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || HOME_DESCRIPTION} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
