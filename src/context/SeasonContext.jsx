import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useContent } from "./ContentContext";
import { resolveSeason } from "../lib/season";

const SeasonContext = createContext(null);

export function SeasonProvider({ children, forced = null }) {
  const content = useContent();
  const [visitorOverride, setVisitorOverride] = useState(null);

  const season = useMemo(() => {
    if (forced) return forced;
    return resolveSeason({ adminOverride: content.seasonOverride, visitorOverride });
  }, [forced, visitorOverride, content.seasonOverride]);

  useEffect(() => {
    const s = content.seasons[season];
    const root = document.documentElement;
    root.style.setProperty("--accent", s.accent);
    root.style.setProperty("--accent-deep", s.accentDeep);
    root.setAttribute("data-season", season);
  }, [season, content.seasons]);

  const value = useMemo(
    () => ({ season, data: content.seasons[season], content, setVisitorOverride, forced }),
    [season, forced, content]
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export const useSeason = () => {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason doit être utilisé dans <SeasonProvider>");
  return ctx;
};
