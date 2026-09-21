import { useLocation } from "react-router-dom";
import { useSeason } from "../context/SeasonContext";
import Seo from "../components/Seo";
import { Helmet } from "react-helmet-async";
import { buildJsonLd } from "../lib/jsonld";
import Hero from "../components/Hero";
import BookingBar from "../components/BookingBar";
import TrustStrip from "../components/TrustStrip";
import Pillars from "../components/Pillars";
import LodgeCards from "../components/LodgeCards";
import Domaine from "../components/Domaine";
import Detente from "../components/Detente";
import Services from "../components/Services";
import CTA from "../components/CTA";

export default function Home() {
  const { data, content, season } = useSeason();
  const { pathname } = useLocation();
  return (
    <>
      <Seo title={`${content.residence.nom} — ${data.hero.titre}`} description={data.hero.sousTitre} path={pathname} image={data.hero.image || "/images/hero-hiver.jpg"} />
      <Helmet><script type="application/ld+json">{JSON.stringify(buildJsonLd(content, season))}</script></Helmet>
      <Hero />
      <BookingBar />
      <TrustStrip />
      <Pillars />
      <LodgeCards />
      <Domaine />
      <Detente />
      <Services />
      <CTA />
    </>
  );
}

