// lib/api.ts
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const doFetch = () => fetch(input, { ...init, credentials: "include" });

  let res = await doFetch();

  if (res.status !== 401) return res;

  // 401 → essayer de refresh en silence
  const refresh = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refresh.ok) {
    // refresh impossible → on force la reconnexion
    window.location.href = "/auth/login?role=medecin&expired=true";
    return res;
  }
  if (!refresh.ok) {
    // refresh impossible → on force la reconnexion
    window.location.href = "/auth/login?role=patient&expired=true";
    return res;
  }

  // Rejouer la requête avec le nouveau token cookie
  res = await doFetch();
  return res;
}
