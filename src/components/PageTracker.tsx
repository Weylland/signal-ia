"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Tracker de pages maison : envoie une vue à /api/track à chaque changement de
 * route. Le référent externe n'est transmis qu'au premier chargement (les navs
 * internes ne polluent pas les sources de trafic). Aucun cookie, aucun traceur tiers.
 */
export function PageTracker({ lang }: { lang: string }) {
  const pathname = usePathname();
  const firstLoad = useRef(true);
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastSent.current === pathname) return; // évite le double-fire (StrictMode)
    lastSent.current = pathname;

    const ref = firstLoad.current ? document.referrer || null : null;
    firstLoad.current = false;

    const payload = JSON.stringify({ path: pathname, ref, lang });
    // sendBeacon survit aux changements de page ; fetch en repli.
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
      /* repli fetch */
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname, lang]);

  return null;
}
