import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { getSession } from "../lib/cms";
import { getState } from "../lib/cms";
import { ContentOverride } from "../context/ContentContext";
import { SeasonProvider } from "../context/SeasonContext";
import TopBar from "../components/TopBar";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Home from "../pages/Home";

function Center({ children }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>{children}</div>;
}
const btn = (on) => ({ fontFamily: "inherit", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 4, padding: "6px 12px", cursor: "pointer", background: on ? "#3E7C4E" : "#444", color: "#fff" });

export default function PreviewApp() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [content, setContent] = useState(null);
  const [view, setView] = useState("desktop");
  const [err, setErr] = useState("");

  useEffect(() => {
    getSession().then((s) => setSession(s)).catch(() => setSession(null)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (session) getState().then((st) => setContent(st.draftContent)).catch((e) => setErr(e.message));
  }, [session]);

  if (!ready) return <Center>Chargement…</Center>;
  if (!session) return <Center>Accès réservé. Connectez-vous d'abord via <a href="/admin">/admin</a>.</Center>;
  if (err) return <Center>Erreur : {err}</Center>;
  if (!content) return <Center>Chargement du brouillon…</Center>;

  return (
    <div style={{ background: "#333", minHeight: "100vh" }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /><title>Aperçu privé — Les Cimes</title></Helmet>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#111", color: "#fff", padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Aperçu privé du brouillon</strong>
        <button onClick={() => setView("desktop")} style={btn(view === "desktop")}>Ordinateur</button>
        <button onClick={() => setView("mobile")} style={btn(view === "mobile")}>Mobile</button>
        <a href="/admin" style={{ color: "#9cf", marginLeft: "auto", fontSize: 13 }}>← Retour admin</a>
      </div>
      <div style={{ width: view === "mobile" ? 390 : "100%", margin: "0 auto", background: "#fff", boxShadow: "0 0 40px rgba(0,0,0,.4)" }}>
        <ContentOverride content={content}>
          <SeasonProvider>
            <TopBar /><Nav /><main><Home /></main><Footer />
          </SeasonProvider>
        </ContentOverride>
      </div>
    </div>
  );
}
