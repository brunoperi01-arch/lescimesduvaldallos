import { Outlet, ScrollRestoration } from "react-router-dom";
import { ContentProvider } from "../context/ContentContext";
import { SeasonProvider } from "../context/SeasonContext";
import SeasonBanner from "./SeasonBanner";
import TopBar from "./TopBar";
import Nav from "./Nav";
import Footer from "./Footer";
import StickyReserve from "./StickyReserve";

export default function RootLayout({ forced = null }) {
  return (
    <ContentProvider>
      <SeasonProvider forced={forced}>
        <ScrollRestoration />
        <a href="#main" className="skip-link">Aller au contenu</a>
        <SeasonBanner />
        <TopBar />
        <Nav />
        <main id="main"><Outlet /></main>
        <Footer />
        <StickyReserve />
      </SeasonProvider>
    </ContentProvider>
  );
}
