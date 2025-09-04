// lib/useSessionRefresher.ts
import { useEffect } from "react";

type GetToken = () => string | null | undefined;

/**
 * Programme un refresh silencieux ~1 minute avant l’expiration de l’access token.
 * - attend que getToken() renvoie le JWT actuel
 * - décode son exp
 * - fait un POST sur /api/auth/refresh
 * - si une nouvelle valeur "token" est renvoyée, la stocke (localStorage) et déclenche
 *   un callback optionnel pour mettre à jour l'état local du composant.
 */
export function useSessionRefresher(
  getToken: GetToken,
  onNewToken?: (t: string) => void
) {
  useEffect(() => {
    const t = getToken?.();
    if (!t) return;

    let timeoutId: number | undefined;

    try {
      const payload = JSON.parse(atob(t.split(".")[1] || ""));
      const msBeforeExp = payload?.exp ? payload.exp * 1000 - Date.now() : 0;
      const msBeforeRefresh = Math.max(5_000, msBeforeExp - 60_000); // refresh ~1 min avant

      timeoutId = window.setTimeout(async () => {
        const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (r.ok) {
          const data = await r.json().catch(() => null);
          if (data?.token) {
            // Maj stockage local si tu utilises localStorage pour l'Authorization
            localStorage.setItem("token", data.token);
            onNewToken?.(data.token);
          }
        }
      }, msBeforeRefresh);
    } catch {
      // en cas d’échec de parse, ne rien faire
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [getToken, onNewToken]);
}
