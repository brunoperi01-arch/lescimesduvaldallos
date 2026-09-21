import { createContext, useContext, useEffect, useState } from "react";
import { validateContent } from "../lib/contentSchema";
import { chooseContentSource } from "../lib/contentSource";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const source = chooseContentSource({
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      allowFallback: import.meta.env.VITE_ALLOW_LOCAL_CONTENT_FALLBACK === "true",
    });
    async function load() {
      try {
        if (source === "api") {
          const r = await fetch("/api/content/published", { headers: { Accept: "application/json" } });
          if (!r.ok) throw new Error("api");
          const json = await r.json();
          if (cancelled) return;
          if (!validateContent(json).success) return setError(new Error("Contenu publié invalide."));
          setContent(json);
        } else {
          // dev/e2e : fichier local validé
          const r = await fetch("/content.json", { cache: "no-cache" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const json = await r.json();
          if (cancelled) return;
          if (!validateContent(json).success) return setError(new Error("content.json local invalide."));
          setContent(json);
        }
      } catch (e) { if (!cancelled) setError(e); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", fontFamily: "system-ui", padding: 40, textAlign: "center" }}>
        <div>
          <p style={{ fontWeight: 700 }}>Site momentanément indisponible.</p>
          <p style={{ color: "#5B6E78" }}>Merci de réessayer dans quelques instants — ou contactez la résidence au 04 92 83 65 59.</p>
        </div>
      </div>
    );
  }
  if (!content) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><img src="/images/logo.png" alt="" width="90" style={{ opacity: .6 }} /></div>;
  }
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
export function ContentOverride({ content, children }) { return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>; }
export const useContent = () => useContext(ContentContext);
