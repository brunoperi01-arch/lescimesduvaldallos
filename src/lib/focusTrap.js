import { useEffect } from "react";

const SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Éléments focusables à l'intérieur d'un conteneur (ordre du DOM).
export function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(SELECTOR));
}

// Piège de focus pour une modale / un menu :
// - focus initial sur le 1er élément ;
// - Tab/Shift+Tab bouclent à l'intérieur ;
// - Échap ferme ;
// - restitution du focus à l'élément déclencheur à la fermeture ;
// - blocage du scroll de fond.
export function useFocusTrap(active, containerRef, onClose) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement;
    const container = containerRef.current;
    const first = getFocusable(container)[0];
    (first || container)?.focus?.();

    function onKey(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose && onClose(); return; }
      if (e.key !== "Tab") return;
      const items = getFocusable(container);
      if (items.length === 0) { e.preventDefault(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [active, containerRef, onClose]);
}
