import { Helmet } from "react-helmet-async";

const BASE = "https://www.lescimesduvaldallos.com";

export default function Seo({ title, description, path = "/", image = "/images/hero-hiver.jpg" }) {
  const canonical = BASE + path;
  const img = image.startsWith("http") ? image : BASE + image;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
